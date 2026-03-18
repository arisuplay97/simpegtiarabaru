"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { downloadSimplePdf } from "@/lib/demo-files"
import {
  Download,
  Printer,
  Mail,
  Building2,
  User,
  CreditCard,
  CheckCircle2,
} from "lucide-react"

const slipData = {
  employee: {
    name: "Ahmad Rizki Pratama, S.Kom., M.T.",
    nik: "198501152010011001",
    jabatan: "Kepala Bagian Teknologi Informasi",
    unitKerja: "IT & Sistem",
    golongan: "C/II",
    masaKerja: "16 tahun 2 bulan",
    bank: "Bank Mandiri",
    noRekening: "1234567890123",
  },
  period: "Maret 2026",
  payDate: "25 Maret 2026",
  pendapatan: [
    { kode: "001", nama: "Gaji Pokok", jumlah: 5850000 },
    { kode: "002", nama: "Tunjangan Jabatan", jumlah: 1500000 },
    { kode: "003", nama: "Tunjangan Keluarga", jumlah: 585000 },
    { kode: "004", nama: "Tunjangan Transport", jumlah: 650000 },
    { kode: "005", nama: "Tunjangan Makan", jumlah: 465000 },
    { kode: "006", nama: "Insentif Kinerja", jumlah: 750000 },
    { kode: "007", nama: "Lembur", jumlah: 450000 },
  ],
  potongan: [
    { kode: "P01", nama: "BPJS Kesehatan (4%)", jumlah: 234000 },
    { kode: "P02", nama: "BPJS Ketenagakerjaan JHT (2%)", jumlah: 117000 },
    { kode: "P03", nama: "BPJS Ketenagakerjaan JP (1%)", jumlah: 58500 },
    { kode: "P04", nama: "PPh 21", jumlah: 485500 },
    { kode: "P05", nama: "Iuran Koperasi", jumlah: 150000 },
    { kode: "P06", nama: "Cicilan Pinjaman", jumlah: 200000 },
  ],
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export default function SlipGajiPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026")

  const totalPendapatan = useMemo(() => slipData.pendapatan.reduce((sum, item) => sum + item.jumlah, 0), [])
  const totalPotongan = useMemo(() => slipData.potongan.reduce((sum, item) => sum + item.jumlah, 0), [])
  const gajiBersih = totalPendapatan - totalPotongan

  const handlePrint = () => {
    toast.success("Membuka mode print slip gaji")
    window.print()
  }

  const handleDownload = () => {
    const lines = [
      `Periode: ${slipData.period}`,
      `Nama: ${slipData.employee.name}`,
      `NIK: ${slipData.employee.nik}`,
      `Jabatan: ${slipData.employee.jabatan}`,
      `Unit Kerja: ${slipData.employee.unitKerja}`,
      `Golongan: ${slipData.employee.golongan}`,
      `Bank: ${slipData.employee.bank}`,
      `No Rekening: ${slipData.employee.noRekening}`,
      `Total Pendapatan: ${formatCurrency(totalPendapatan)}`,
      `Total Potongan: ${formatCurrency(totalPotongan)}`,
      `Gaji Bersih: ${formatCurrency(gajiBersih)}`,
      "",
      "Rincian Pendapatan:",
      ...slipData.pendapatan.map((item) => `- ${item.nama}: ${formatCurrency(item.jumlah)}`),
      "",
      "Rincian Potongan:",
      ...slipData.potongan.map((item) => `- ${item.nama}: ${formatCurrency(item.jumlah)}`),
    ]
    downloadSimplePdf(`slip-gaji-${selectedPeriod}.pdf`, "Slip Gaji Pegawai", lines)
    toast.success("PDF slip gaji berhasil diunduh")
  }

  const handleEmail = () => {
    toast.success("Mengirim slip gaji ke ahmad.rizki@example.com")
    window.setTimeout(() => {
      toast.success("Slip gaji berhasil dikirim lewat email")
    }, 1200)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Remunerasi", "Slip Gaji"]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Slip Gaji Digital</h1>
              <p className="text-sm text-muted-foreground">Lihat dan download slip gaji Anda</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mar-2026">Maret 2026</SelectItem>
                  <SelectItem value="feb-2026">Februari 2026</SelectItem>
                  <SelectItem value="jan-2026">Januari 2026</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print</Button>
              <Button variant="outline" onClick={handleEmail}><Mail className="mr-2 h-4 w-4" />Kirim Email</Button>
              <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
            </div>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden border shadow-sm">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white overflow-hidden">
                      <Image src="/logo-tar.png" alt="Logo TAR" width={56} height={56} className="object-contain" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">PDAM Tirta Ardhia Rinjani</h2>
                      <p className="text-sm text-primary-foreground/80">Jl. Merdeka No. 123, Jakarta Selatan 12430</p>
                      <p className="text-sm text-primary-foreground/80">Telp: (021) 1234567 | info@pdamtiara.co.id</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white hover:bg-white/30">
                    <CheckCircle2 className="mr-1 h-3 w-3" />Terverifikasi
                  </Badge>
                </div>
                <Separator className="my-4 bg-white/20" />
                <div className="text-center">
                  <h3 className="text-2xl font-bold">SLIP GAJI PEGAWAI</h3>
                  <p className="text-primary-foreground/80">Periode: {slipData.period}</p>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="mb-6 grid gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Nama:</span><span className="font-medium">{slipData.employee.name}</span></div>
                    <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">NIK:</span><span className="font-mono font-medium">{slipData.employee.nik}</span></div>
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Jabatan:</span><span className="font-medium">{slipData.employee.jabatan}</span></div>
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Unit Kerja:</span><span className="font-medium">{slipData.employee.unitKerja}</span></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Golongan:</span><Badge variant="outline">{slipData.employee.golongan}</Badge></div>
                    <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Masa Kerja:</span><span className="font-medium">{slipData.employee.masaKerja}</span></div>
                    <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Bank:</span><span className="font-medium">{slipData.employee.bank}</span></div>
                    <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">No. Rekening:</span><span className="font-mono font-medium">{slipData.employee.noRekening}</span></div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-emerald-600">Pendapatan</h4>
                    <div className="rounded-lg border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Kode</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Keterangan</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slipData.pendapatan.map((item) => (
                            <tr key={item.kode} className="border-b last:border-0">
                              <td className="px-3 py-2 font-mono text-xs">{item.kode}</td>
                              <td className="px-3 py-2 text-sm">{item.nama}</td>
                              <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(item.jumlah)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-red-600">Potongan</h4>
                    <div className="rounded-lg border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Kode</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Keterangan</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slipData.potongan.map((item) => (
                            <tr key={item.kode} className="border-b last:border-0">
                              <td className="px-3 py-2 font-mono text-xs">{item.kode}</td>
                              <td className="px-3 py-2 text-sm">{item.nama}</td>
                              <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(item.jumlah)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border bg-muted/40 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Pendapatan</div>
                      <div className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(totalPendapatan)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Potongan</div>
                      <div className="mt-1 text-lg font-bold text-red-600">{formatCurrency(totalPotongan)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gaji Bersih</div>
                      <div className="mt-1 text-xl font-bold text-primary">{formatCurrency(gajiBersih)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
