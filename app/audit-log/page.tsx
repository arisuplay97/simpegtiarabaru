"use client"

// app/audit-log/page.tsx

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { getAuditLogs, exportAuditLogCSV } from "@/lib/actions/audit-log"
import {
  Search, Download, ChevronLeft, ChevronRight, Shield,
  Eye, RefreshCw, Clock, User, Activity,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  EXPORT: "bg-yellow-100 text-yellow-700",
  IMPORT: "bg-orange-100 text-orange-700",
  APPROVE: "bg-teal-100 text-teal-700",
  REJECT: "bg-rose-100 text-rose-700",
}

const MODULES = [
  "all", "pegawai", "payroll", "absensi", "cuti", "lembur",
  "shift", "pph21", "mutasi", "kgb", "kenaikan-pangkat",
  "settings", "audit-log",
]

const ACTIONS = [
  "all", "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
  "EXPORT", "IMPORT", "APPROVE", "REJECT",
]

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [module, setModule] = useState("all")
  const [action, setAction] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const limit = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAuditLogs({ page, limit, module, action, search, dateFrom, dateTo }) as any
      if (res.error) { toast.error(res.error); return }
      setLogs(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, module, action, search, dateFrom, dateTo])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function handleExport() {
    const res = await exportAuditLogCSV({ module, action, dateFrom, dateTo }) as any
    if (res.error) { toast.error(res.error); return }
    const blob = new Blob([res.csv!], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-log-${format(new Date(), "yyyyMMdd-HHmm")}.csv`
    a.click()
    toast.success("Export berhasil")
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Sistem", "Audit Log"]} />
        <main className="flex-1 p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Audit Log Sistem</h1>
                <p className="text-sm text-muted-foreground">
                  Rekam jejak seluruh aktivitas pengguna — {total.toLocaleString("id-ID")} entri
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari email atau nama target..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  />
                </div>
                <Select value={module} onValueChange={(v) => { setModule(v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Semua Modul" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((m) => (
                      <SelectItem key={m} value={m}>{m === "all" ? "Semua Modul" : m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={action} onValueChange={(v) => { setAction(v); setPage(1) }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Semua Aksi" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a === "all" ? "Semua Aksi" : a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date" className="w-[150px]"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                />
                <Input
                  type="date" className="w-[150px]"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead><Clock className="h-4 w-4 inline mr-1" />Waktu</TableHead>
                      <TableHead><User className="h-4 w-4 inline mr-1" />User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead><Activity className="h-4 w-4 inline mr-1" />Aksi</TableHead>
                      <TableHead>Modul</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Tidak ada log ditemukan
                        </TableCell>
                      </TableRow>
                    ) : logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{log.userRole}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.module}</TableCell>
                        <TableCell className="text-xs max-w-[160px] truncate">{log.targetName || log.targetId || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress || "-"}</TableCell>
                        <TableCell>
                          {(log.oldData || log.newData) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(log)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Halaman {page} dari {totalPages} ({total.toLocaleString("id-ID")} total)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Perubahan Data</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Waktu: </span>{format(new Date(selected.createdAt), "dd MMM yyyy HH:mm:ss", { locale: localeId })}</div>
                <div><span className="text-muted-foreground">User: </span>{selected.userEmail}</div>
                <div><span className="text-muted-foreground">Aksi: </span>{selected.action}</div>
                <div><span className="text-muted-foreground">Modul: </span>{selected.module}</div>
              </div>
              {selected.oldData && (
                <div>
                  <p className="text-sm font-semibold mb-1 text-red-600">Data Sebelum:</p>
                  <ScrollArea className="h-40 rounded border bg-red-50/50 p-3">
                    <pre className="text-xs">{JSON.stringify(selected.oldData, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
              {selected.newData && (
                <div>
                  <p className="text-sm font-semibold mb-1 text-green-600">Data Sesudah:</p>
                  <ScrollArea className="h-40 rounded border bg-green-50/50 p-3">
                    <pre className="text-xs">{JSON.stringify(selected.newData, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
