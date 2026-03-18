"use client"

import { useMemo, useState } from "react"
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
import { toast } from "sonner"
import {
  Plane,
  Clock,
  ArrowRightLeft,
  Wallet,
  FileText,
  Star,
  TrendingUp,
  ChevronRight,
} from "lucide-react"

type ApprovalType = "all" | "cuti" | "lembur" | "mutasi" | "payroll" | "dokumen" | "pangkat" | "gaji"
type ApprovalStep = "hrd" | "direktur" | "final"
type ApprovalStatus = "pending" | "urgent" | "overdue" | "approved" | "rejected"

interface ApprovalItem {
  id: string
  employeeName: string
  employeeAvatar?: string
  employeeInitials: string
  unit: string
  type: ApprovalType
  title: string
  date: string
  status: ApprovalStatus
  slaHours?: number
  description?: string
  currentStep: ApprovalStep
  approvedBy?: string[]
  rejectedBy?: string
  updatedAt?: string
  note?: string
}

const approvalTypes: { value: ApprovalType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Semua", icon: FileText },
  { value: "cuti", label: "Cuti/Izin", icon: Plane },
  { value: "lembur", label: "Lembur", icon: Clock },
  { value: "mutasi", label: "Mutasi", icon: ArrowRightLeft },
  { value: "payroll", label: "Payroll", icon: Wallet },
  { value: "dokumen", label: "Dokumen", icon: FileText },
  { value: "pangkat", label: "Pangkat", icon: Star },
  { value: "gaji", label: "Gaji", icon: TrendingUp },
]

const initialApprovalItems: ApprovalItem[] = [
  {
    id: "1",
    employeeName: "Ahmad Rizki Pratama",
    employeeInitials: "AR",
    unit: "IT & Sistem",
    type: "cuti",
    title: "Pengajuan Cuti Tahunan",
    date: "18-22 Mar 2026",
    status: "urgent",
    slaHours: 4,
    description: "Cuti untuk keperluan keluarga",
    currentStep: "hrd",
    approvedBy: [],
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    employeeInitials: "SN",
    unit: "Keuangan",
    type: "lembur",
    title: "Pengajuan Lembur",
    date: "15 Mar 2026",
    status: "pending",
    slaHours: 12,
    description: "Lembur closing laporan bulanan",
    currentStep: "hrd",
    approvedBy: [],
  },
  {
    id: "3",
    employeeName: "Budi Santoso",
    employeeInitials: "BS",
    unit: "Distribusi",
    type: "mutasi",
    title: "Usulan Mutasi",
    date: "Efektif 1 Apr 2026",
    status: "pending",
    slaHours: 48,
    description: "Mutasi ke Cabang Utara",
    currentStep: "direktur",
    approvedBy: ["HRD"],
  },
  {
    id: "4",
    employeeName: "Dewi Lestari",
    employeeInitials: "DL",
    unit: "Pelayanan",
    type: "pangkat",
    title: "Kenaikan Pangkat",
    date: "Periode Q1 2026",
    status: "overdue",
    slaHours: 0,
    description: "C/I ke C/II",
    currentStep: "hrd",
    approvedBy: [],
  },
  {
    id: "5",
    employeeName: "Eko Prasetyo",
    employeeInitials: "EP",
    unit: "Produksi",
    type: "gaji",
    title: "Kenaikan Gaji Berkala",
    date: "TMT 1 Apr 2026",
    status: "pending",
    slaHours: 24,
    description: "KGB masa kerja 2 tahun",
    currentStep: "direktur",
    approvedBy: ["HRD"],
  },
]

function getTypeIcon(type: ApprovalType) {
  const iconMap: Record<ApprovalType, React.ElementType> = {
    all: FileText,
    cuti: Plane,
    lembur: Clock,
    mutasi: ArrowRightLeft,
    payroll: Wallet,
    dokumen: FileText,
    pangkat: Star,
    gaji: TrendingUp,
  }
  return iconMap[type]
}

function getStepLabel(step: ApprovalStep) {
  if (step === "hrd") return "Menunggu Review HRD"
  if (step === "direktur") return "Menunggu Persetujuan Direktur"
  return "Final"
}

function getStatusBadge(status: ApprovalStatus) {
  const styles = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    urgent: "bg-orange-100 text-orange-700 border-orange-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
  }
  const labels = {
    pending: "Pending",
    urgent: "Urgent",
    overdue: "Overdue",
    approved: "Disetujui",
    rejected: "Ditolak",
  }
  return (
    <Badge variant="outline" className={cn("text-[10px]", styles[status])}>
      {labels[status]}
    </Badge>
  )
}

export function ApprovalPanel() {
  const [selectedType, setSelectedType] = useState<ApprovalType>("all")
  const [items, setItems] = useState<ApprovalItem[]>(initialApprovalItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const filteredItems = useMemo(() => {
    return selectedType === "all" ? items : items.filter((item) => item.type === selectedType)
  }, [items, selectedType])

  const selectedItem = items.find((item) => item.id === selectedId) ?? null
  const pendingCount = items.filter((item) => ["pending", "urgent", "overdue"].includes(item.status)).length

  const updateItem = (id: string, updater: (item: ApprovalItem) => ApprovalItem) => {
    setItems((prev) => prev.map((item) => (item.id === id ? updater(item) : item)))
  }

  const handleApprove = () => {
    if (!selectedItem) return
    updateItem(selectedItem.id, (item) => {
      if (item.currentStep === "hrd") {
        return {
          ...item,
          currentStep: "direktur",
          status: "pending",
          approvedBy: [...(item.approvedBy ?? []), "HRD"],
          updatedAt: new Date().toLocaleString("id-ID"),
          note,
        }
      }
      return {
        ...item,
        currentStep: "final",
        status: "approved",
        approvedBy: [...(item.approvedBy ?? []), "Direktur"],
        updatedAt: new Date().toLocaleString("id-ID"),
        note,
      }
    })
    toast.success(selectedItem.currentStep === "hrd" ? "Approval dilanjutkan ke Direktur" : "Approval final disetujui")
    setSelectedId(null)
    setNote("")
  }

  const handleReject = () => {
    if (!selectedItem) return
    updateItem(selectedItem.id, (item) => ({
      ...item,
      status: "rejected",
      rejectedBy: item.currentStep === "hrd" ? "HRD" : "Direktur",
      updatedAt: new Date().toLocaleString("id-ID"),
      note,
    }))
    toast.success("Pengajuan ditolak")
    setSelectedId(null)
    setNote("")
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Approval Center</h3>
            <p className="text-xs text-muted-foreground">{pendingCount} pengajuan menunggu</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            Lihat Semua
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-2 py-2">
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-1">
            {approvalTypes.map((type) => {
              const count = type.value === "all" ? items.length : items.filter((item) => item.type === type.value).length
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selectedType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <type.icon className="h-3 w-3" />
                  {type.label}
                  <span className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]",
                    selectedType === type.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type)
            return (
              <div key={item.id} className="rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={item.employeeAvatar} />
                    <AvatarFallback className="bg-secondary text-xs">{item.employeeInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{item.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="mt-2 flex items-start gap-2">
                      <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                        <TypeIcon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{item.date} • {getStepLabel(item.currentStep)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-muted-foreground">SLA: {item.slaHours ?? 0} jam</div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedId(item.id)}>Review</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) { setSelectedId(null); setNote("") } }}>
        <DialogContent className="sm:max-w-xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>{selectedItem.employeeName} • {selectedItem.unit}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">Status Saat Ini</div>
                    <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Current Step</div>
                    <div className="mt-1 font-medium">{getStepLabel(selectedItem.currentStep)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tanggal</div>
                    <div className="mt-1 font-medium">{selectedItem.date}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Approved By</div>
                    <div className="mt-1 font-medium">{selectedItem.approvedBy?.length ? selectedItem.approvedBy.join(", ") : "Belum ada"}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Keterangan</div>
                    <div className="mt-1 font-medium">{selectedItem.description}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Catatan Reviewer</div>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan review jika diperlukan" />
                </div>
                {selectedItem.updatedAt && (
                  <div className="text-xs text-muted-foreground">Update terakhir: {selectedItem.updatedAt}</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleReject}>Tolak</Button>
                {selectedItem.status !== "approved" && selectedItem.status !== "rejected" && (
                  <Button onClick={handleApprove}>
                    {selectedItem.currentStep === "hrd" ? "Setujui & Lanjut ke Direktur" : "Setujui Final"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
