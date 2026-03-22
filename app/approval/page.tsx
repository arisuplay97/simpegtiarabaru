"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  Briefcase,
  ArrowRightLeft,
  Star,
  CheckCircle2,
  XCircle,
  TrendingUp,
  User,
  FileText,
} from "lucide-react"

import { getPendingApprovals, processUnifiedApproval, UnifiedApprovalItem } from "@/lib/actions/approval"

const getTypeIcon = (type: string) => {
  switch (type) {
    case "cuti": return <Calendar className="w-5 h-5 text-blue-500" />
    case "lembur": return <Clock className="w-5 h-5 text-indigo-500" />
    case "mutasi": return <ArrowRightLeft className="w-5 h-5 text-amber-500" />
    case "pangkat": return <Star className="w-5 h-5 text-emerald-500" />
    case "kgb": return <TrendingUp className="w-5 h-5 text-emerald-600" />
    default: return <Briefcase className="w-5 h-5 text-slate-500" />
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "urgent":
      return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 rounded-md py-0 text-[10px] uppercase font-bold tracking-wider">Urgent</Badge>
    case "overdue":
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 rounded-md py-0 text-[10px] uppercase font-bold tracking-wider">Overdue</Badge>
    default:
      return null
  }
}

export default function ApprovalDashboardPage() {
  const { data: session } = useSession()
  const user = session?.user
  const isHRD = user?.role === "HRD" || user?.role === "SUPERADMIN" || user?.role === "DIREKSI"

  const [items, setItems] = useState<UnifiedApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedItem, setSelectedItem] = useState<UnifiedApprovalItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPendingApprovals()
      // Sort so overdue/urgent is at the top
      data.sort((a, b) => {
        if (a.priority === "overdue" && b.priority !== "overdue") return -1
        if (b.priority === "overdue" && a.priority !== "overdue") return 1
        if (a.priority === "urgent" && b.priority !== "urgent") return -1
        if (b.priority === "urgent" && a.priority !== "urgent") return 1
        return 0
      })
      setItems(data)
    } catch (e: any) {
      toast.error("Gagal memuat task approval")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === "all" || item.type === activeTab
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const stats = {
    all: items.length,
    cuti: items.filter(i => i.type === "cuti").length,
    mutasi: items.filter(i => i.type === "mutasi").length,
    pangkat: items.filter(i => i.type === "pangkat").length,
    kgb: items.filter(i => i.type === "kgb").length,
    urgent: items.filter(i => i.priority === "urgent" || i.priority === "overdue").length,
  }

  const handleApprove = async (item: UnifiedApprovalItem) => {
    setIsSubmitting(true)
    try {
      const res = await processUnifiedApproval(item.type, item.originalId, true, user?.id || "")
      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan berhasil disetujui")
      setIsDetailOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyetujui")
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
      const res = await processUnifiedApproval(selectedItem.type, selectedItem.originalId, false, user?.id || "", rejectReason)
      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan telah ditolak")
      setIsRejectOpen(false)
      setIsDetailOpen(false)
      loadData()
      setRejectReason("")
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak")
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewDetails = (item: UnifiedApprovalItem) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  if (!isHRD) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900">Akses Dibatasi</h2>
          <p className="text-sm text-slate-500 mt-2">Hanya Admin, HRD, atau Direksi yang dapat melihat Approval Dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Approval Panel", "Dashboard"]} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Task Approval</h1>
                <p className="text-slate-500 text-sm mt-1 sm:mt-2">
                  Tinjau dan putuskan berbagai pengajuan kepegawaian yang masuk.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{stats.urgent} Urgent Task</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Column: Filters */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-slate-200 shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800 text-sm">Kategori Pengajuan</h3>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <button 
                      onClick={() => setActiveTab("all")}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                        activeTab === "all" ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-500"/> Semua Pengajuan</span>
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-mono text-xs">{stats.all}</Badge>
                    </button>
                    <button 
                      onClick={() => setActiveTab("cuti")}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                        activeTab === "cuti" ? "bg-blue-50 text-blue-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500"/> Cuti Pegawai</span>
                      <Badge variant="secondary" className="bg-blue-100 hover:bg-blue-100 text-blue-700 font-mono text-xs">{stats.cuti}</Badge>
                    </button>
                    <button 
                      onClick={() => setActiveTab("mutasi")}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                        activeTab === "mutasi" ? "bg-amber-50 text-amber-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-amber-500"/> Mutasi & Rotasi</span>
                      <Badge variant="secondary" className="bg-amber-100 hover:bg-amber-100 text-amber-700 font-mono text-xs">{stats.mutasi}</Badge>
                    </button>
                    <button 
                      onClick={() => setActiveTab("pangkat")}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                        activeTab === "pangkat" ? "bg-emerald-50 text-emerald-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2"><Star className="w-4 h-4 text-emerald-500"/> Kenaikan Pangkat</span>
                      <Badge variant="secondary" className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 font-mono text-xs">{stats.pangkat}</Badge>
                    </button>
                    <button 
                      onClick={() => setActiveTab("kgb")}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                        activeTab === "kgb" ? "bg-emerald-50 text-emerald-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600"/> KGB</span>
                      <Badge variant="secondary" className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 font-mono text-xs">{stats.kgb}</Badge>
                    </button>
                  </div>
                </Card>
              </div>

              {/* Right Column: List */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Cari berdasarkan nama, unit, atau judul pengajuan..." 
                    className="pl-10 h-11 bg-white border-slate-200 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
                     <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                     <p className="text-slate-500 font-medium">Memuat antrian task...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Semua Selesai!</h3>
                    <p className="text-slate-500 max-w-sm">
                      Tidak ada task approval tertunda yang perlu ditangani saat ini pada kategori ini.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-280px)] pr-4 -mr-4">
                    <div className="space-y-3 pb-8">
                      {filteredItems.map(item => (
                        <Card key={item.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
                          <CardContent className="p-0">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
                              
                              {/* Icon logic */}
                              <div className="hidden sm:flex flex-col items-center justify-start shrink-0 pt-1">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center border shadow-sm",
                                  item.type === 'cuti' ? "bg-blue-50 border-blue-100" :
                                  item.type === 'lembur' ? "bg-indigo-50 border-indigo-100" :
                                  item.type === 'mutasi' ? "bg-amber-50 border-amber-100" :
                                  item.type === 'pangkat' ? "bg-emerald-50 border-emerald-100" :
                                  "bg-slate-50 border-slate-100"
                                )}>
                                  {getTypeIcon(item.type)}
                                </div>
                              </div>

                              {/* Main info */}
                              <div className="flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                                      {item.title}
                                    </h3>
                                    {getPriorityBadge(item.priority)}
                                  </div>
                                  <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline-flex bg-slate-100 px-2 py-1 rounded-md font-medium">
                                    {item.submittedDate}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-slate-600 line-clamp-1 mb-3">
                                  {item.description}
                                </p>

                                <div className="flex items-center gap-3 mt-auto flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6 border bg-white">
                                      <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-semibold">{item.employeeInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-semibold text-slate-800 leading-none">{item.employeeName}</span>
                                      <span className="text-[10px] text-slate-500">{item.unit}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="w-1 h-1 bg-slate-300 rounded-full mx-1 hidden sm:block"></div>
                                  
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border px-2 py-1 rounded-md">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{item.date}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5 sm:ml-2">
                                <Button 
                                  className="w-full sm:w-auto font-medium" 
                                  onClick={() => viewDetails(item)}
                                >
                                  Tinjau Data
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* DETAIL DIALOG */}
      {selectedItem && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-slate-50/50">
            {/* ... Modal Header ... */}
            <div className="bg-white px-6 py-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm",
                    selectedItem.type === 'cuti' ? "bg-blue-50 border-blue-100" :
                    selectedItem.type === 'mutasi' ? "bg-amber-50 border-amber-100" :
                    selectedItem.type === 'pangkat' ? "bg-emerald-50 border-emerald-100" :
                    "bg-slate-50 border-slate-100"
                  )}>
                    {getTypeIcon(selectedItem.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">{selectedItem.title}</DialogTitle>
                      {getPriorityBadge(selectedItem.priority)}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Diajukan pada tanggal {selectedItem.submittedDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="max-h-[60vh]">
              <div className="p-6 space-y-6">
                
                {/* Section: Employee Info */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Informasi Pegawai
                  </h4>
                  <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <Avatar className="w-12 h-12 border bg-white shadow-sm">
                      <AvatarFallback className="text-sm bg-slate-100 text-slate-700 font-bold">{selectedItem.employeeInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Nama Lengkap</p>
                        <p className="font-semibold text-slate-900">{selectedItem.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">NIK Karyawan</p>
                        <p className="font-semibold text-slate-900 font-mono">{selectedItem.employeeNik}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Jabatan Lengkap</p>
                        <p className="font-semibold text-slate-900">{selectedItem.jabatan}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Unit Kerja / Bidang</p>
                        <p className="font-semibold text-slate-900">{selectedItem.unit}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Request Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Detail Pengajuan
                  </h4>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50/80 border-b border-slate-100">
                      <p className="text-slate-800 text-sm font-medium leading-relaxed">"{selectedItem.description}"</p>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-slate-500 w-1/3 font-medium bg-slate-50/50">Tanggal Terkait</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {selectedItem.date}
                            </td>
                          </tr>
                          {Object.entries(selectedItem.details).map(([key, value], idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                              <td className="py-3 px-4 text-slate-500 w-1/3 font-medium bg-slate-50/50">{key}</td>
                              <td className="py-3 px-4 font-semibold text-slate-900">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </ScrollArea>

            {/* Footer / Actions */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDetailOpen(false)}>
                Tutup Review
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto font-medium shadow-sm hover:bg-rose-600 text-white" 
                  onClick={() => setIsRejectOpen(true)}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Tolak Pengajuan
                </Button>
                <Button 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 font-medium shadow-sm text-white border-transparent" 
                  onClick={() => handleApprove(selectedItem)}
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Memproses..." : "Setujui Pengajuan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* REJECT DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              Tolak Pengajuan
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan. Pesan ini akan dikirim ke pegawai yang bersangkutan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Penolakan <span className="text-red-500">*</span></Label>
              <Textarea 
                id="reason" 
                placeholder="Contoh: Dokumen lampiran tidak valid, kuota cuti tidak mencukupi..." 
                className="min-h-[100px] resize-none focus-visible:ring-rose-500"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsRejectOpen(false); setRejectReason("") }}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !rejectReason.trim()}>
              {isSubmitting ? "Memproses..." : "Konfirmasi Penolakan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
