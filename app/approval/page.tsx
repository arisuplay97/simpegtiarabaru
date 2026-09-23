"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Check,
  X,
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  Briefcase,
  ArrowRightLeft,
  Star,
  CheckCircle2,
  TrendingUp,
  User,
  FileText,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  CalendarDays,
  FileCheck,
  Layers,
  Sparkles,
} from "lucide-react"

import {
  getPendingApprovals,
  processUnifiedApproval,
  UnifiedApprovalItem,
  ApprovalType,
} from "@/lib/actions/approval"

export default function ApprovalDashboardPage() {
  const { data: session } = useSession()
  const user = session?.user
  const userRole = user?.role?.toString().toUpperCase() || ""
  const isAuthorized = userRole === "HRD" || userRole === "SUPERADMIN" || userRole === "DIREKSI"

  const [items, setItems] = useState<UnifiedApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [urgentOnly, setUrgentOnly] = useState(false)

  // Modals
  const [selectedItem, setSelectedItem] = useState<UnifiedApprovalItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const data = await getPendingApprovals()
      setItems(data)
    } catch {
      toast.error("Gagal memuat task approval")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      loadData(true)
    }
    window.addEventListener("approval-updated", handleUpdate)
    return () => window.removeEventListener("approval-updated", handleUpdate)
  }, [loadData])

  // Statistics for executive ribbon
  const stats = useMemo(() => {
    return {
      all: items.length,
      cuti: items.filter((i) => i.type === "cuti").length,
      mutasi: items.filter((i) => i.type === "mutasi").length,
      pangkat: items.filter((i) => i.type === "pangkat").length,
      kgb: items.filter((i) => i.type === "kgb").length,
      koreksi: items.filter((i) => i.type === "koreksi_absensi").length,
      urgent: items.filter((i) => i.priority === "urgent" || i.priority === "overdue").length,
    }
  }, [items])

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTab = activeTab === "all" || item.type === activeTab
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesUrgent = !urgentOnly || item.priority === "urgent" || item.priority === "overdue"

      return matchesTab && matchesSearch && matchesUrgent
    })
  }, [items, activeTab, searchQuery, urgentOnly])

  const handleApprove = async (item: UnifiedApprovalItem) => {
    setIsSubmitting(true)
    try {
      const res = await processUnifiedApproval(item.type, item.originalId, true, user?.id || "")
      if (res.error) throw new Error(res.error)

      toast.success(`Pengajuan ${item.title} untuk ${item.employeeName} berhasil disetujui`)
      setIsDetailOpen(false)
      setSelectedItem(null)
      loadData(true)
      window.dispatchEvent(new Event("approval-updated"))
    } catch (err: any) {
      toast.error(err.message || "Gagal menyetujui pengajuan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedItem) return
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await processUnifiedApproval(
        selectedItem.type,
        selectedItem.originalId,
        false,
        user?.id || "",
        rejectReason
      )
      if (res.error) throw new Error(res.error)

      toast.success(`Pengajuan ${selectedItem.title} telah ditolak`)
      setIsRejectOpen(false)
      setIsDetailOpen(false)
      setSelectedItem(null)
      setRejectReason("")
      loadData(true)
      window.dispatchEvent(new Event("approval-updated"))
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak pengajuan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewDetails = (item: UnifiedApprovalItem) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const getTypeStyle = (type: ApprovalType) => {
    switch (type) {
      case "cuti":
        return {
          badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60",
          icon: Calendar,
          label: "Cuti & Izin",
        }
      case "mutasi":
        return {
          badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60",
          icon: ArrowRightLeft,
          label: "Mutasi Tugas",
        }
      case "pangkat":
        return {
          badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60",
          icon: Star,
          label: "Kenaikan Pangkat",
        }
      case "kgb":
        return {
          badgeBg: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60",
          icon: TrendingUp,
          label: "KGB Reguler",
        }
      case "koreksi_absensi":
        return {
          badgeBg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60",
          icon: Clock,
          label: "Koreksi Absen",
        }
      default:
        return {
          badgeBg: "bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
          icon: Briefcase,
          label: "Pengajuan",
        }
    }
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#09090b] items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-[#111113] rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Akses Dibatasi</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
            Hanya Administrator, HRD, dan Direksi yang berwenang meninjau atau menyetujui pengajuan kepegawaian.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#09090b]">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kepegawaian", "Approval Center"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* ============================================================
             1. HEADER & ACTIONS BAR
             ============================================================ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-2xl shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  Approval Center
                </h1>
                <Badge variant="outline" className="bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60 text-[11px] font-bold rounded-lg px-2.5 py-0.5 whitespace-nowrap">
                  Live Database
                </Badge>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-1">
                Pusat verifikasi dan otorisasi berkas pengajuan kepegawaian PDAM Tirta Ardhia Rinjani.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="h-9 px-3 text-xs font-semibold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefreshing && "animate-spin text-blue-600")} />
                Segarkan
              </Button>
            </div>
          </div>

          {/* ============================================================
             2. EXECUTIVE KPI RIBBON (Interactive Category Cards)
             ============================================================ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. Total */}
            <button
              onClick={() => { setActiveTab("all"); setUrgentOnly(false); }}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
                activeTab === "all" && !urgentOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#111113] border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                  activeTab === "all" && !urgentOnly ? "text-blue-100" : "text-slate-400 dark:text-zinc-500"
                )}>
                  Semua Berkas
                </span>
                <Layers className={cn(
                  "w-3.5 h-3.5",
                  activeTab === "all" && !urgentOnly ? "text-white" : "text-slate-400"
                )} />
              </div>
              <p className={cn(
                "text-xl sm:text-2xl font-black mt-1.5 tracking-tight",
                activeTab === "all" && !urgentOnly ? "text-white" : "text-slate-900 dark:text-zinc-50"
              )}>
                {stats.all}
              </p>
              <p className={cn(
                "text-[10px] mt-0.5 truncate",
                activeTab === "all" && !urgentOnly ? "text-blue-100" : "text-slate-500 dark:text-zinc-400"
              )}>
                Menunggu keputusan
              </p>
            </button>

            {/* 2. Cuti */}
            <button
              onClick={() => { setActiveTab("cuti"); setUrgentOnly(false); }}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
                activeTab === "cuti" && !urgentOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#111113] border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                  activeTab === "cuti" && !urgentOnly ? "text-blue-100" : "text-slate-400 dark:text-zinc-500"
                )}>
                  Cuti & Izin
                </span>
                <CalendarDays className={cn(
                  "w-3.5 h-3.5",
                  activeTab === "cuti" && !urgentOnly ? "text-white" : "text-blue-500"
                )} />
              </div>
              <p className={cn(
                "text-xl sm:text-2xl font-black mt-1.5 tracking-tight",
                activeTab === "cuti" && !urgentOnly ? "text-white" : "text-slate-900 dark:text-zinc-50"
              )}>
                {stats.cuti}
              </p>
              <p className={cn(
                "text-[10px] mt-0.5 truncate",
                activeTab === "cuti" && !urgentOnly ? "text-blue-100" : "text-slate-500 dark:text-zinc-400"
              )}>
                Izin & cuti sakit
              </p>
            </button>

            {/* 3. Koreksi Absensi */}
            <button
              onClick={() => { setActiveTab("koreksi_absensi"); setUrgentOnly(false); }}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
                activeTab === "koreksi_absensi" && !urgentOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#111113] border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                  activeTab === "koreksi_absensi" && !urgentOnly ? "text-blue-100" : "text-slate-400 dark:text-zinc-500"
                )}>
                  Koreksi Absen
                </span>
                <Clock className={cn(
                  "w-3.5 h-3.5",
                  activeTab === "koreksi_absensi" && !urgentOnly ? "text-white" : "text-indigo-500"
                )} />
              </div>
              <p className={cn(
                "text-xl sm:text-2xl font-black mt-1.5 tracking-tight",
                activeTab === "koreksi_absensi" && !urgentOnly ? "text-white" : "text-slate-900 dark:text-zinc-50"
              )}>
                {stats.koreksi}
              </p>
              <p className={cn(
                "text-[10px] mt-0.5 truncate",
                activeTab === "koreksi_absensi" && !urgentOnly ? "text-blue-100" : "text-slate-500 dark:text-zinc-400"
              )}>
                Per sesi kerja
              </p>
            </button>

            {/* 4. Mutasi */}
            <button
              onClick={() => { setActiveTab("mutasi"); setUrgentOnly(false); }}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
                activeTab === "mutasi" && !urgentOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#111113] border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                  activeTab === "mutasi" && !urgentOnly ? "text-blue-100" : "text-slate-400 dark:text-zinc-500"
                )}>
                  Mutasi & Rotasi
                </span>
                <ArrowRightLeft className={cn(
                  "w-3.5 h-3.5",
                  activeTab === "mutasi" && !urgentOnly ? "text-white" : "text-amber-500"
                )} />
              </div>
              <p className={cn(
                "text-xl sm:text-2xl font-black mt-1.5 tracking-tight",
                activeTab === "mutasi" && !urgentOnly ? "text-white" : "text-slate-900 dark:text-zinc-50"
              )}>
                {stats.mutasi}
              </p>
              <p className={cn(
                "text-[10px] mt-0.5 truncate",
                activeTab === "mutasi" && !urgentOnly ? "text-blue-100" : "text-slate-500 dark:text-zinc-400"
              )}>
                Perpindahan tugas
              </p>
            </button>

            {/* 5. KGB & Pangkat */}
            <button
              onClick={() => { setActiveTab("pangkat"); setUrgentOnly(false); }}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
                (activeTab === "pangkat" || activeTab === "kgb") && !urgentOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#111113] border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                  (activeTab === "pangkat" || activeTab === "kgb") && !urgentOnly ? "text-blue-100" : "text-slate-400 dark:text-zinc-500"
                )}>
                  Karier & Gaji
                </span>
                <Star className={cn(
                  "w-3.5 h-3.5",
                  (activeTab === "pangkat" || activeTab === "kgb") && !urgentOnly ? "text-white" : "text-emerald-500"
                )} />
              </div>
              <p className={cn(
                "text-xl sm:text-2xl font-black mt-1.5 tracking-tight",
                (activeTab === "pangkat" || activeTab === "kgb") && !urgentOnly ? "text-white" : "text-slate-900 dark:text-zinc-50"
              )}>
                {stats.pangkat + stats.kgb}
              </p>
              <p className={cn(
                "text-[10px] mt-0.5 truncate",
                (activeTab === "pangkat" || activeTab === "kgb") && !urgentOnly ? "text-blue-100" : "text-slate-500 dark:text-zinc-400"
              )}>
                Pangkat & KGB
              </p>
            </button>

            {/* 6. Butuh Tindakan Segera (> 3 Hari) */}
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden col-span-2 sm:col-span-1",
                urgentOnly
                  ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/10"
                  : stats.urgent > 0
                  ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300"
                  : "bg-white dark:bg-[#111113] border-slate-200/80 dark:border-zinc-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                  urgentOnly ? "text-rose-100" : stats.urgent > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-400 dark:text-zinc-500"
                )}>
                  Prioritas / SLA
                </span>
                <AlertCircle className={cn(
                  "w-3.5 h-3.5",
                  urgentOnly ? "text-white" : stats.urgent > 0 ? "text-rose-600" : "text-slate-400"
                )} />
              </div>
              <p className={cn(
                "text-xl sm:text-2xl font-black mt-1.5 tracking-tight",
                urgentOnly ? "text-white" : stats.urgent > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-zinc-50"
              )}>
                {stats.urgent}
              </p>
              <p className={cn(
                "text-[10px] mt-0.5 truncate font-medium",
                urgentOnly ? "text-rose-100" : stats.urgent > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-zinc-400"
              )}>
                {urgentOnly ? "Filter aktif" : stats.urgent > 0 ? "Menunggu > 3 hari" : "Dalam SLA"}
              </p>
            </button>
          </div>

          {/* ============================================================
             3. TOOLBAR (Search & Category Pills)
             ============================================================ */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#111113] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama pegawai, NIK, unit kerja, alasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9.5 text-xs bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 rounded-xl focus-visible:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: "all", label: "Semua", count: stats.all },
                { key: "cuti", label: "Cuti & Izin", count: stats.cuti },
                { key: "koreksi_absensi", label: "Koreksi Absen", count: stats.koreksi },
                { key: "mutasi", label: "Mutasi", count: stats.mutasi },
                { key: "pangkat", label: "Pangkat", count: stats.pangkat },
                { key: "kgb", label: "KGB", count: stats.kgb },
              ].map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isActive
                          ? "bg-slate-700 text-white dark:bg-zinc-300 dark:text-zinc-900"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ============================================================
             4. CARDS LISTING (Anti-AI-Slop Enterprise Cards)
             ============================================================ */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <div className="h-8 w-8 rounded-full border-3 border-blue-600/30 border-t-blue-600 animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                Memuat antrean pengajuan kepegawaian...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
                <Check className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">
                Semua Disposisi Selesai
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
                Tidak ada berkas yang tertunda pada kategori ini. Seluruh pengajuan kepegawaian telah ditinjau dan diputuskan.
              </p>
              {(searchQuery || urgentOnly || activeTab !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setActiveTab("all")
                    setUrgentOnly(false)
                  }}
                  className="mt-4 text-xs font-semibold"
                >
                  Reset Filter Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item) => {
                const typeStyle = getTypeStyle(item.type)
                const TypeIcon = typeStyle.icon

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111113] p-3 sm:px-4 sm:py-3 hover:border-blue-400/50 hover:shadow-xs transition-all duration-150"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      
                      {/* Left: Avatar + Employee identity & details */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 rounded-xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs shrink-0">
                          <AvatarImage src={item.employeeAvatar || undefined} className="object-cover" />
                          <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">
                            {item.employeeInitials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Row 1: Employee Name, NIK, Type Badge, SLA */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {item.employeeName}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold shrink-0">
                              {item.employeeNik}
                            </span>
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0",
                              typeStyle.badgeBg
                            )}>
                              <TypeIcon className="w-3 h-3" />
                              {item.badgeLabel || item.type}
                            </span>
                            {item.priority === "overdue" && (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 shrink-0">
                                Lewat SLA ({item.waitingDays} hari)
                              </Badge>
                            )}
                            {item.priority === "urgent" && (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 shrink-0">
                                Prioritas ({item.waitingDays} hari)
                              </Badge>
                            )}
                          </div>

                          {/* Row 2: Jabatan, Unit, Periode, Meta Tags */}
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-zinc-400">
                            <span className="truncate max-w-[200px]">{item.jabatan || "Staff"}</span>
                            <span className="text-slate-300 dark:text-zinc-700">•</span>
                            <span className="truncate max-w-[200px]">{item.unit || "Umum"}</span>
                            <span className="text-slate-300 dark:text-zinc-700">•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {item.date}
                            </span>

                            {item.type === "cuti" && item.details?.["Sisa Saldo Cuti"] && (
                              <>
                                <span className="text-slate-300 dark:text-zinc-700">•</span>
                                <span>Saldo: <strong className="text-slate-700 dark:text-zinc-200">{item.details["Sisa Saldo Cuti"]}</strong></span>
                              </>
                            )}

                            {item.type === "mutasi" && item.details?.["Unit Kerja Tujuan"] && (
                              <>
                                <span className="text-slate-300 dark:text-zinc-700">•</span>
                                <span>Tujuan: <strong className="text-amber-600 dark:text-amber-400">{item.details["Unit Kerja Tujuan"]}</strong></span>
                              </>
                            )}

                            {item.dokumenUrl && (
                              <>
                                <span className="text-slate-300 dark:text-zinc-700">•</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(item.dokumenUrl || null)}
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                >
                                  <FileText className="w-3 h-3" />
                                  Lampiran
                                </button>
                              </>
                            )}
                          </div>

                          {/* Row 3: Inline Keterangan */}
                          {item.description && (
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1 truncate max-w-3xl">
                              <span className="font-semibold text-slate-700 dark:text-zinc-300">Keterangan:</span> “{item.description}”
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Submission date & Action Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-zinc-800/80 w-full lg:w-auto justify-between lg:justify-end">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 hidden xl:inline-block">
                          Diajukan {item.submittedDate}
                        </span>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDetails(item)}
                            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:border-slate-400"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Detail
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsRejectOpen(true)
                            }}
                            className="h-8 px-2.5 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleApprove(item)}
                            disabled={isSubmitting}
                            className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Setujui
                          </Button>
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </main>
      </div>

      {/* ============================================================
         5. DETAIL REVIEW MODAL
         ============================================================ */}
      {selectedItem && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
            {/* Modal Header */}
            <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 flex flex-row items-center gap-3 text-left">
              {(() => {
                const style = getTypeStyle(selectedItem.type)
                const IconComponent = style.icon
                return (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                )
              })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {selectedItem.title}
                  </DialogTitle>
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-[10px] uppercase font-bold">
                    {selectedItem.badgeLabel || selectedItem.type}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Diajukan pada {selectedItem.submittedDate} (Menunggu {selectedItem.waitingDays} hari kerja)
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Modal Content */}
            <ScrollArea className="max-h-[60vh] p-5 space-y-4 text-xs">
              {/* Pegawai Box */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 flex items-center gap-3">
                <Avatar className="h-11 w-11 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs shrink-0">
                  <AvatarImage src={selectedItem.employeeAvatar || undefined} className="object-cover" />
                  <AvatarFallback className="font-bold text-sm bg-blue-600 text-white">
                    {selectedItem.employeeInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1 min-w-0">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Nama Pegawai</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{selectedItem.employeeName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">NIK / No. Induk</span>
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100">{selectedItem.employeeNik}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Jabatan</span>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 truncate">{selectedItem.jabatan || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Unit Kerja / Bidang</span>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 truncate">{selectedItem.unit || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-zinc-800/70 font-bold text-slate-800 dark:text-zinc-200 text-xs">
                  Rincian Parameter Pengajuan
                </div>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 flex justify-between gap-4">
                    <span className="text-slate-500 font-medium shrink-0">Alasan / Dasar Pengajuan</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                      "{selectedItem.description || "-"}"
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 flex justify-between gap-4">
                    <span className="text-slate-500 font-medium shrink-0">Periode / Tanggal Efektif</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 text-right">
                      {selectedItem.date || "-"}
                    </span>
                  </div>
                  {Object.entries(selectedItem.details || {}).map(([k, v]) => (
                    <div key={k} className="p-3 bg-white dark:bg-zinc-900 flex justify-between gap-4">
                      <span className="text-slate-500 font-medium shrink-0">{k}</span>
                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                        {String(v ?? "-")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Lampiran */}
              {selectedItem.dokumenUrl && (
                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Dokumen Lampiran (Surat Keterangan Dokter / Bukti Izin)
                    </span>
                    <a
                      href={selectedItem.dokumenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"
                    >
                      Buka Dokumen Asli <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 flex justify-center">
                    <img
                      src={selectedItem.dokumenUrl}
                      alt="Lampiran Surat Dokter"
                      className="max-h-64 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Modal Footer */}
            <DialogFooter className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 flex flex-row items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                disabled={isSubmitting}
                className="h-8 text-xs font-semibold"
              >
                Tutup Review
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50"
                  onClick={() => setIsRejectOpen(true)}
                  disabled={isSubmitting}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Tolak Pengajuan
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  onClick={() => handleApprove(selectedItem)}
                  disabled={isSubmitting}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {isSubmitting ? "Memproses..." : "Setujui Pengajuan"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================
         6. REJECT CONFIRMATION DIALOG
         ============================================================ */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base font-bold">
              <AlertCircle className="h-5 w-5" />
              Tolak Pengajuan Kepegawaian
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Kirimkan alasan penolakan secara jelas. Notifikasi otomatis akan dikirimkan kepada pegawai yang bersangkutan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="alasan-modal" className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              Alasan Penolakan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="alasan-modal"
              placeholder="Contoh: Dokumen bukti dokter tidak jelas, kuota saldo cuti tahunan telah habis..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs min-h-[100px] resize-none focus-visible:ring-rose-500"
            />
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRejectOpen(false)
                setRejectReason("")
              }}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Penolakan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
         7. IMAGE PREVIEW MODAL
         ============================================================ */}
      {previewImageUrl && (
        <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
          <DialogContent className="sm:max-w-3xl p-2 bg-slate-900 border-slate-800 text-white">
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800">
              <span className="text-xs font-bold">Surat Keterangan / Bukti Lampiran</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white h-7 px-2"
                onClick={() => setPreviewImageUrl(null)}
              >
                Tutup
              </Button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImageUrl}
                alt="Bukti Lampiran"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
