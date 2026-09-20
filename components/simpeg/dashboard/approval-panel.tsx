"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  ArrowRightLeft,
  FileText,
  Star,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Eye,
} from "lucide-react"
import {
  getPendingApprovals,
  processUnifiedApproval,
  UnifiedApprovalItem,
  ApprovalType,
} from "@/lib/actions/approval"

const approvalCategories: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Semua", icon: FileText },
  { value: "cuti", label: "Cuti & Izin", icon: Calendar },
  { value: "mutasi", label: "Mutasi", icon: ArrowRightLeft },
  { value: "pangkat", label: "Pangkat", icon: Star },
  { value: "kgb", label: "KGB", icon: TrendingUp },
]

function getTypeIcon(type: ApprovalType) {
  switch (type) {
    case "cuti": return Calendar
    case "mutasi": return ArrowRightLeft
    case "pangkat": return Star
    case "kgb": return TrendingUp
    default: return FileText
  }
}

function getPriorityBadge(priority: "normal" | "urgent" | "overdue", waitingDays?: number) {
  if (priority === "overdue") {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 text-[10px] font-bold px-1.5 py-0">
        Overdue {waitingDays ? `(${waitingDays}h)` : ""}
      </Badge>
    )
  }
  if (priority === "urgent") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0">
        Prioritas {waitingDays ? `(${waitingDays}h)` : ""}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 text-[10px] font-medium px-1.5 py-0">
      Normal
    </Badge>
  )
}

export function ApprovalPanel() {
  const { data: session } = useSession()
  const userId = session?.user?.id || ""

  const [items, setItems] = useState<UnifiedApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Modal State
  const [selectedItem, setSelectedItem] = useState<UnifiedApprovalItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const data = await getPendingApprovals()
      setItems(data)
    } catch {
      toast.error("Gagal memuat daftar pengajuan pending")
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return items
    return items.filter((item) => item.type === selectedCategory)
  }, [items, selectedCategory])

  const counts = useMemo(() => {
    return {
      all: items.length,
      cuti: items.filter((i) => i.type === "cuti").length,
      mutasi: items.filter((i) => i.type === "mutasi").length,
      pangkat: items.filter((i) => i.type === "pangkat").length,
      kgb: items.filter((i) => i.type === "kgb").length,
    }
  }, [items])

  const handleApprove = async (item: UnifiedApprovalItem) => {
    setProcessing(true)
    try {
      const res = await processUnifiedApproval(item.type, item.originalId, true, userId)
      if (res.error) throw new Error(res.error)

      toast.success(`Pengajuan ${item.title} berhasil disetujui`)
      setIsDetailOpen(false)
      setSelectedItem(null)
      loadData(true)
      window.dispatchEvent(new Event("approval-updated"))
    } catch (err: any) {
      toast.error(err.message || "Gagal menyetujui pengajuan")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedItem) return
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }

    setProcessing(true)
    try {
      const res = await processUnifiedApproval(
        selectedItem.type,
        selectedItem.originalId,
        false,
        userId,
        rejectReason
      )
      if (res.error) throw new Error(res.error)

      toast.success(`Pengajuan ${selectedItem.title} ditolak`)
      setIsRejectOpen(false)
      setIsDetailOpen(false)
      setSelectedItem(null)
      setRejectReason("")
      loadData(true)
      window.dispatchEvent(new Event("approval-updated"))
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak pengajuan")
    } finally {
      setProcessing(false)
    }
  }

  const openReview = (item: UnifiedApprovalItem) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs overflow-hidden">
      
      {/* ── TOP BAR HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Antrean Persetujuan
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {items.length} berkas menunggu disposisi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Segarkan Data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-blue-600")} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 text-xs font-semibold px-2.5 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-blue-500"
          >
            <Link href="/approval">
              Modul Penuh
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── HORIZONTAL CATEGORY PILLS ── */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#111113] overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {approvalCategories.map((cat) => {
            const count = counts[cat.value as keyof typeof counts] ?? 0
            const active = selectedCategory === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                  active
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-zinc-100"
                )}
              >
                <cat.icon className="h-3 w-3" />
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CARD LIST ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <div className="h-7 w-7 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin mb-3" />
            <p className="text-xs font-medium">Memuat data persetujuan riil...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-xs">
              <Check className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-1">
              Semua Pengajuan Selesai
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-[260px] leading-relaxed">
              Tidak ada pengajuan kepegawaian yang membutuhkan tindakan persetujuan saat ini.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type)
            return (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3.5 transition-all hover:border-blue-400/80 hover:shadow-xs"
              >
                {/* Header row: type badge & priority badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "flex h-5 items-center gap-1 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      item.type === "cuti" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50" :
                      item.type === "mutasi" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50" :
                      item.type === "pangkat" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50" :
                      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50"
                    )}>
                      <TypeIcon className="h-3 w-3" />
                      {item.badgeLabel || item.type}
                    </span>
                  </div>

                  {getPriorityBadge(item.priority, item.waitingDays)}
                </div>

                {/* Employee info */}
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs shrink-0">
                    <AvatarImage src={item.employeeAvatar || undefined} className="object-cover" />
                    <AvatarFallback className="text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                      {item.employeeInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {item.employeeName}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                        {item.submittedDate}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {item.jabatan} • {item.unit}
                    </p>

                    <div className="mt-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-zinc-300 border border-slate-100 dark:border-zinc-800 line-clamp-2">
                      <span className="font-medium text-slate-800 dark:text-zinc-200">Alasan:</span> {item.description}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {item.date}
                      </span>

                      {item.dokumenUrl && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          <FileText className="h-3 w-3" /> Ada Lampiran
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions bottom row */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-medium px-2.5"
                    onClick={() => openReview(item)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Review Detail
                  </Button>

                  <Button
                    size="sm"
                    className="h-7 text-xs font-semibold px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    onClick={() => handleApprove(item)}
                    disabled={processing}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Setujui
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── DETAIL & DECISION MODAL ── */}
      {selectedItem && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider">
                    {selectedItem.type}
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {selectedItem.title}
                  </h3>
                </div>
                {getPriorityBadge(selectedItem.priority, selectedItem.waitingDays)}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Diajukan pada {selectedItem.submittedDate} (Menunggu {selectedItem.waitingDays} hari)
              </p>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Pegawai Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                <Avatar className="h-11 w-11 rounded-xl border border-slate-200 dark:border-zinc-700">
                  <AvatarImage src={selectedItem.employeeAvatar || undefined} className="object-cover" />
                  <AvatarFallback className="font-bold text-sm bg-slate-100 dark:bg-zinc-800">
                    {selectedItem.employeeInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{selectedItem.employeeName}</h4>
                  <p className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">NIK: {selectedItem.employeeNik}</p>
                  <p className="text-slate-600 dark:text-zinc-300 text-[11px]">{selectedItem.jabatan} • {selectedItem.unit}</p>
                </div>
              </div>

              {/* Rincian Permohonan */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-zinc-800/60 font-bold text-slate-700 dark:text-zinc-200">
                  Rincian Informasi Pengajuan
                </div>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  <div className="p-3 bg-white dark:bg-zinc-900 flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Alasan / Keterangan</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right max-w-[65%]">
                      "{selectedItem.description}"
                    </span>
                  </div>
                  {Object.entries(selectedItem.details || {}).map(([key, val]) => (
                    <div key={key} className="p-3 bg-white dark:bg-zinc-900 flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">{key}</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right max-w-[65%]">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lampiran Gambar / Dokumen jika ada */}
              {selectedItem.dokumenUrl && (
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-3 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      Lampiran Surat Dokter / Bukti Izin
                    </span>
                    <a
                      href={selectedItem.dokumenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Buka Asli <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 max-h-48 bg-slate-100 flex items-center justify-center">
                    <img
                      src={selectedItem.dokumenUrl}
                      alt="Surat Dokter"
                      className="object-contain max-h-48 w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                disabled={processing}
              >
                Tutup
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => setIsRejectOpen(true)}
                disabled={processing}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Tolak
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleApprove(selectedItem)}
                disabled={processing}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {processing ? "Menyimpan..." : "Setujui Sekarang"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── REJECT REASON DIALOG ── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base font-bold">
              <AlertCircle className="h-5 w-5" />
              Tolak Pengajuan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kirimkan alasan penolakan agar pegawai mengetahui tindak lanjut yang perlu dilakukan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="alasan" className="text-xs font-semibold">
              Alasan Penolakan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="alasan"
              placeholder="Contoh: Lampiran surat keterangan dokter tidak terbaca, sisa cuti tidak mencukupi..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs min-h-[90px] resize-none"
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
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {processing ? "Memproses..." : "Konfirmasi Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
