"use client"

// app/absensi/import-fingerprint/page.tsx

import { useState, useRef, useEffect } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { importFingerprint, getRiwayatImport, deleteImportRiwayat } from "@/lib/actions/fingerprint-import"
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle,
  Clock, CloudUpload, RefreshCw, Download, Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const STATUS_STYLE: Record<string, { label: string; class: string; icon: any }> = {
  PROCESSING: { label: "Diproses", class: "bg-yellow-100 text-yellow-700", icon: Clock },
  SELESAI:    { label: "Selesai",  class: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  GAGAL:      { label: "Gagal",    class: "bg-red-100 text-red-700",       icon: XCircle },
}

export default function ImportFingerprintPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchHistory = async () => {
    const data = await getRiwayatImport()
    setHistory(data as any[])
  }
  useEffect(() => { fetchHistory() }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleImport = async () => {
    if (!file) { toast.error("Pilih file terlebih dahulu"); return }
    setLoading(true); setResult(null)
    const fd = new FormData()
    fd.append("file", file)
    const res = await importFingerprint(fd)
    setLoading(false)
    setResult(res)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success(`Import selesai: ${res.berhasil} berhasil dari ${res.total} record`)
    fetchHistory()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus/rollback riwayat import ini? Seluruh data absensi yang terkait dengan import ini juga akan dihapus.")) return
    
    setLoading(true)
    const res = await deleteImportRiwayat(id)
    setLoading(false)
    
    if ("error" in res) {
      toast.error(res.error!)
    } else {
      toast.success("Riwayat import berhasil dihapus")
      fetchHistory()
    }
  }

  const successRate = result?.total > 0 ? Math.round((result.berhasil / result.total) * 100) : 0

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kehadiran", "Import Mesin Fingerprint"]} />
        <main className="flex-1 p-6 space-y-6 max-w-5xl">
          <div>
            <h1 className="text-xl font-bold">Import Data Mesin Fingerprint</h1>
            <p className="text-sm text-muted-foreground">Upload data absensi dari mesin fingerprint (ZKTeco, Hikvision, dll)</p>
          </div>

          {/* Format info */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Format File yang Didukung
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid md:grid-cols-2 gap-4 text-xs text-blue-800">
                <div>
                  <p className="font-semibold mb-1">📄 Format CSV (kolom):</p>
                  <code className="block bg-white/60 rounded p-2 font-mono">
                    NIK,Nama,Tanggal,Jam Masuk,Jam Keluar<br/>
                    100001,Budi,2026-03-01,07:55,17:10<br/>
                    <span className="text-muted-foreground"># atau tanpa kolom Nama:</span><br/>
                    100001,2026-03-01,07:55,17:10
                  </code>
                </div>
                <div>
                  <p className="font-semibold mb-1">📄 Format TXT/DAT (ZKTeco attendance log):</p>
                  <code className="block bg-white/60 rounded p-2 font-mono">
                    100001  2026-03-01 07:55:00  0  1<br/>
                    100001  2026-03-01 17:10:00  0  0<br/>
                    100002  2026-03-01 08:02:00  0  1
                  </code>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3">
                ⚡ Status absensi (HADIR / TERLAMBAT) dihitung otomatis berdasarkan pengaturan jam masuk kantor.
                NIK di file harus sesuai dengan NIK pegawai di sistem.
              </p>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef} type="file" accept=".csv,.txt,.dat" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <CloudUpload className={`h-12 w-12 mx-auto mb-3 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
                {file ? (
                  <div>
                    <p className="font-semibold text-primary">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Drag & drop file atau klik untuk pilih</p>
                    <p className="text-sm text-muted-foreground mt-1">Mendukung: .csv, .txt, .dat</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4 gap-3">
                {file && (
                  <Button variant="outline" onClick={() => { setFile(null); setResult(null) }}>Batal</Button>
                )}
                <Button onClick={handleImport} disabled={!file || loading} className="min-w-[140px]">
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? "Memproses..." : "Import Sekarang"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {result && !("error" in result) && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Hasil Import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-700">{result.total}</p>
                    <p className="text-xs text-muted-foreground">Total Record</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-700">{result.berhasil}</p>
                    <p className="text-xs text-muted-foreground">Berhasil</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-red-700">{result.gagal}</p>
                    <p className="text-xs text-muted-foreground">Gagal</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Tingkat Keberhasilan</span>
                    <span className="font-semibold">{successRate}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>
                {result.errorLog?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-2">Error Log ({result.errorLog.length} baris gagal):</p>
                    <ScrollArea className="h-32 border rounded-lg bg-red-50/50 p-3">
                      {result.errorLog.map((err: any, i: number) => (
                        <p key={i} className="text-xs font-mono text-red-700">
                          Baris {err.row} | NIK {err.nik}: {err.error}
                        </p>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Riwayat Import</CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchHistory}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama File</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Berhasil</TableHead>
                    <TableHead className="text-center">Gagal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                        Belum ada riwayat import
                      </TableCell>
                    </TableRow>
                  ) : history.map((h) => {
                    const st = STATUS_STYLE[h.status] || STATUS_STYLE.PROCESSING
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />{h.namaFile}
                        </TableCell>
                        <TableCell className="text-center text-sm">{h.totalRecord}</TableCell>
                        <TableCell className="text-center text-sm text-green-700 font-semibold">{h.berhasil}</TableCell>
                        <TableCell className="text-center text-sm text-red-700 font-semibold">{h.gagal}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.class}`}>{st.label}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(h.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(h.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
