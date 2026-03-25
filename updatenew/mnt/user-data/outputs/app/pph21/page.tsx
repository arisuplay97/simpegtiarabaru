"use client"

// app/pph21/page.tsx — Ganti file yang ada (sebelumnya "Sedang Dikembangkan")

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import { getPPh21List, prosesPPh21Batch, exportESPT } from "@/lib/actions/pph21"
import {
  Download, Calculator, RefreshCw, FileText,
  TrendingUp, Users, DollarSign, ChevronLeft, ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

function getBulanOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: localeId }),
    })
  }
  return options
}

export default function PPh21Page() {
  const bulanOptions = getBulanOptions()
  const [periode, setPeriode] = useState(bulanOptions[0].value)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getPPh21List(periode)
    if ("error" in res) { toast.error(res.error!); setLoading(false); return }
    setData(res.data)
    setLoading(false)
  }, [periode])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleProses() {
    if (!confirm(`Proses PPh 21 untuk periode ${periode}? Data yang sudah ada akan diperbarui.`)) return
    setProcessing(true)
    const res = await prosesPPh21Batch(periode)
    setProcessing(false)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success(`PPh 21 diproses: ${res.berhasil} berhasil, ${res.gagal} gagal`)
    fetchData()
  }

  async function handleExport() {
    const res = await exportESPT(periode)
    if ("error" in res) { toast.error(res.error!); return }
    const blob = new Blob([res.csv!], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `espt-pph21-${periode}.csv`; a.click()
    toast.success("Export e-SPT berhasil")
  }

  const totalBruto = data.reduce((s, r) => s + r.penghasilanBruto, 0)
  const totalPph21 = data.reduce((s, r) => s + r.pph21Sebulan, 0)

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Remunerasi", "PPh 21 & Kepatuhan Pajak"]} />
        <main className="flex-1 p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">PPh 21 & Kepatuhan Pajak</h1>
              <p className="text-sm text-muted-foreground">Perhitungan otomatis berdasarkan tarif progresif UU HPP 2021</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bulanOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
                <Download className="h-4 w-4 mr-1" /> Export e-SPT
              </Button>
              <Button size="sm" onClick={handleProses} disabled={processing}>
                <Calculator className="h-4 w-4 mr-1" />
                {processing ? "Memproses..." : "Hitung PPh 21"}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Pegawai", value: data.length + " orang", icon: Users, color: "text-blue-600" },
              { label: "Total Bruto", value: fmt(totalBruto), icon: DollarSign, color: "text-green-600" },
              { label: "Total PPh 21", value: fmt(totalPph21), icon: TrendingUp, color: "text-orange-600" },
              { label: "Rata-rata PPh 21", value: data.length > 0 ? fmt(Math.round(totalPph21 / data.length)) : "Rp 0", icon: FileText, color: "text-purple-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-base font-bold mt-0.5">{s.value}</p>
                    </div>
                    <s.icon className={`h-8 w-8 ${s.color} opacity-20`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tarif Info Banner */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-blue-800 font-medium">📋 Tarif PPh 21 Progresif (UU HPP 2021):</p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-blue-700">
                <span>0–60 jt: <b>5%</b></span>
                <span>60–250 jt: <b>15%</b></span>
                <span>250–500 jt: <b>25%</b></span>
                <span>500 jt–5 M: <b>30%</b></span>
                <span>&gt;5 M: <b>35%</b></span>
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
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>PTKP</TableHead>
                      <TableHead className="text-right">Penghasilan Bruto</TableHead>
                      <TableHead className="text-right">Biaya Jabatan</TableHead>
                      <TableHead className="text-right">Penghasilan Netto</TableHead>
                      <TableHead className="text-right">PKP</TableHead>
                      <TableHead className="text-right font-semibold">PPh 21/bln</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          <Calculator className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Belum ada data PPh 21 untuk periode ini.</p>
                          <p className="text-xs mt-1">Klik "Hitung PPh 21" untuk memproses.</p>
                        </TableCell>
                      </TableRow>
                    ) : data.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(r)}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.nama}</p>
                            <p className="text-xs text-muted-foreground">{r.nik}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{r.unit}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.ptkpKode}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{fmt(r.penghasilanBruto)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{fmt(r.biayaJabatan)}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(r.penghasilanNetto)}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(r.pkp)}</TableCell>
                        <TableCell className="text-right font-bold text-sm text-orange-700">{fmt(r.pph21Sebulan)}</TableCell>
                        <TableCell>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail PPh 21 — {selected?.nama}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {[
                ["NIK", selected.nik],
                ["Unit Kerja", selected.unit],
                ["Golongan", selected.golongan],
                ["Status PTKP", `${selected.ptkpKode} (${fmt(selected.ptkpNilai)}/tahun)`],
                ["---"],
                ["Gaji Pokok", fmt(selected.gajiPokok)],
                ["Tunjangan", fmt(selected.tunjangan)],
                ["Penghasilan Bruto/bln", fmt(selected.penghasilanBruto)],
                ["Biaya Jabatan (5%)", fmt(selected.biayaJabatan)],
                ["Penghasilan Netto/bln", fmt(selected.penghasilanNetto)],
                ["---"],
                ["Penghasilan Netto/tahun", fmt(selected.penghasilanNetto * 12)],
                ["PTKP", fmt(selected.ptkpNilai)],
                ["PKP (setahun)", fmt(selected.pkp)],
                ["---"],
                ["PPh 21 Setahun", fmt(selected.pph21Setahun)],
              ].map((row, i) =>
                row[0] === "---" ? (
                  <hr key={i} className="border-border" />
                ) : (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{row[0]}</span>
                    <span className="font-medium">{row[1]}</span>
                  </div>
                )
              )}
              <div className="flex justify-between bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                <span className="font-semibold text-orange-800">PPh 21 Dipotong/Bulan</span>
                <span className="font-bold text-orange-700 text-base">{fmt(selected.pph21Sebulan)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
