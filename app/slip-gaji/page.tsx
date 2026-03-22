"use client"

import { useState, useCallback, useEffect } from "react"
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
  AlertCircle
} from "lucide-react"
import { getMyPayroll } from "@/lib/actions/payroll"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

interface MySlipData {
  pegawaiId: string
  nik: string
  nama: string
  unit: string
  golongan: string
  bank: string
  noRekening: string
  gajiPokok: number
  tunjangan: number
  potongan: number
  gajiBersih: number
  status: string
}

export default function SlipGajiPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026")
  const [slipData, setSlipData] = useState<MySlipData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMySlip = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyPayroll(selectedPeriod)
      setSlipData(res as MySlipData)
    } catch (e) {
      toast.error("Gagal mengambil data slip gaji Anda.")
      setSlipData(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchMySlip()
  }, [fetchMySlip])

  const handlePrint = () => {
    toast.success("Membuka mode print slip gaji")
    window.print()
  }

  const handleDownload = () => {
    if (!slipData) return
    const lines = [
      `Periode: ${selectedPeriod.toUpperCase()}`,
      `Nama: ${slipData.nama}`,
      `NIK: ${slipData.nik}`,
      `Unit Kerja: ${slipData.unit}`,
      `Golongan: ${slipData.golongan}`,
      `Bank: ${slipData.bank}`,
      `No Rekening: ${slipData.noRekening}`,
      `Gaji Pokok: ${formatCurrency(slipData.gajiPokok)}`,
      `Tunjangan: ${formatCurrency(slipData.tunjangan)}`,
      `Potongan: ${formatCurrency(slipData.potongan)}`,
      `Total Gaji Bersih: ${formatCurrency(slipData.gajiBersih)}`,
      "",
      "Slip gaji ini digenerate secara resmi dari HRIS PDAM Tirta Ardhia Rinjani",
    ]
    downloadSimplePdf(`slip-gaji-${selectedPeriod}.pdf`, "Slip Gaji Pegawai", lines)
    toast.success("PDF slip gaji berhasil diunduh")
  }

  const handleEmail = () => {
    toast.success("Mengirim slip gaji ke email terdaftar Anda...")
    window.setTimeout(() => {
      toast.success("Slip gaji berhasil dikirim")
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
              <p className="text-sm text-muted-foreground">Lihat dan download slip gaji Anda (Data Live dari Database)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apr-2026">April 2026</SelectItem>
                  <SelectItem value="mar-2026">Maret 2026</SelectItem>
                  <SelectItem value="feb-2026">Februari 2026</SelectItem>
                  <SelectItem value="jan-2026">Januari 2026</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handlePrint} disabled={!slipData || slipData.status === "draft"}><Printer className="mr-2 h-4 w-4" />Print</Button>
              <Button variant="outline" onClick={handleEmail} disabled={!slipData || slipData.status === "draft"}><Mail className="mr-2 h-4 w-4" />Kirim Email</Button>
              <Button onClick={handleDownload} disabled={!slipData || slipData.status === "draft"}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
            </div>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            <Card className="card-premium overflow-hidden border-b-4 border-b-primary">
              {isLoading ? (
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p className="animate-pulse">Mengambil data slip gaji dari server...</p>
                </CardContent>
              ) : !slipData ? (
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 mb-4 text-amber-500/50" />
                  <p>Anda belum terdaftar sebagai pegawai, atau session login expired.</p>
                </CardContent>
              ) : (
                <CardContent className="p-0">
                  {/* Print / View Mode */}
                  <div className="bg-primary/5 p-6 sm:px-10 sm:py-8" id="slip-gaji-container">
                    {/* Slip Header */}
                    <div className="flex flex-col items-center justify-between gap-6 border-b border-primary/20 pb-6 sm:flex-row">
                      <div className="flex w-full flex-col items-center gap-4 text-center sm:w-auto sm:flex-row sm:text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                          <Image
                            src="/logo-tar.png"
                            alt="Logo TAR"
                            width={56}
                            height={56}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-foreground">
                            PDAM Tirta Ardhia Rinjani
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Slip Gaji Karyawan — Rahasia
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <Badge variant="outline" className="mb-2 bg-white px-3 py-1 font-mono text-sm shadow-sm ring-1 ring-black/5">
                          {selectedPeriod.toUpperCase()}
                        </Badge>
                        <p className="text-sm font-medium text-muted-foreground">
                          Ditransfer: Tanggal 25
                        </p>
                        {slipData.status === "draft" && (
                          <Badge variant="destructive" className="mt-2">BELUM DISAHKAN HRD</Badge>
                        )}
                      </div>
                    </div>

                    {/* Employee Info */}
                    <div className="grid gap-6 py-6 sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/10 bg-white/50 p-4 backdrop-blur-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                          <User className="h-4 w-4" />
                          Data Pegawai
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                          <span className="text-muted-foreground">Nama</span>
                          <span className="font-medium text-foreground">{slipData.nama}</span>
                          <span className="text-muted-foreground">NIK</span>
                          <span className="font-medium text-foreground">{slipData.nik}</span>
                          <span className="text-muted-foreground">Unit Kerja</span>
                          <span className="font-medium text-foreground">{slipData.unit}</span>
                          <span className="text-muted-foreground">Golongan</span>
                          <span className="font-medium text-foreground">{slipData.golongan}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-primary/10 bg-white/50 p-4 backdrop-blur-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                          <Building2 className="h-4 w-4" />
                          Informasi Pembayaran
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                          <span className="text-muted-foreground">Bank</span>
                          <span className="font-medium text-foreground">{slipData.bank}</span>
                          <span className="text-muted-foreground">No Rekening</span>
                          <span className="font-medium text-foreground">{slipData.noRekening}</span>
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium text-emerald-600">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {slipData.status === "draft" ? "Draft Baru" : "Lunas / Terproses"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Slip Details Table */}
                    <div className="rounded-xl border border-primary/10 bg-white shadow-sm ring-1 ring-black/5">
                      <div className="grid gap-0 sm:grid-cols-2">
                        {/* Pendapatan */}
                        <div className="border-b border-primary/10 p-5 sm:border-b-0 sm:border-r">
                          <h3 className="mb-4 flex items-center gap-2 font-semibold text-emerald-700">
                            <TrendingUp className="h-4 w-4" />
                            Penerimaan
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gaji Pokok</span>
                              <span className="font-medium">{formatCurrency(slipData.gajiPokok)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tunjangan</span>
                              <span className="font-medium">{formatCurrency(slipData.tunjangan)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-emerald-700">
                              <span>Total Penerimaan</span>
                              <span>{formatCurrency(slipData.gajiPokok + slipData.tunjangan)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Potongan */}
                        <div className="p-5">
                          <h3 className="mb-4 flex items-center gap-2 font-semibold text-rose-700">
                            <TrendingDown className="h-4 w-4" />
                            Potongan
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Potongan Karyawan</span>
                              <span className="font-medium">{formatCurrency(slipData.potongan)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-rose-700">
                              <span>Total Potongan</span>
                              <span>{formatCurrency(slipData.potongan)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gaji Bersih */}
                      <div className="bg-primary/5 p-6 border-t border-primary/10">
                        <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-primary px-6 py-4 text-primary-foreground sm:flex-row">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                              <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary-foreground/80">
                                Penerimaan Bersih (Take Home Pay)
                              </p>
                            </div>
                          </div>
                          <div className="text-2xl font-bold tracking-tight">
                            {formatCurrency(slipData.gajiBersih)}
                          </div>
                        </div>
                        <p className="mt-4 text-center text-xs text-muted-foreground">
                          Terbilang: (Sistem generate otomatis terbilang rupiah)
                        </p>
                      </div>
                    </div>
                    
                    {/* Footer / Ttd */}
                    <div className="mt-8 flex justify-end">
                       <div className="text-center">
                          <p className="text-sm text-muted-foreground">Mengetahui,</p>
                          <p className="font-medium mt-1">HRD Manager</p>
                          <div className="h-20 w-32 border-b border-dashed border-gray-300 mx-auto opacity-50 my-2 rounded-lg bg-[url('/signature-placeholder.png')] bg-cover bg-center"></div>
                          <p className="text-sm font-bold">Fitri Handayani</p>
                       </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="rounded-lg bg-orange-50 p-4 border border-orange-100 print:hidden text-sm text-orange-800">
              <strong className="block mb-1">Pemberitahuan:</strong>
              Jika ada ketidaksesuaian pada slip gaji Anda, silakan hubungi pihak HRD selambatnya 3 hari setelah payroll diterbitkan.
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Additional icons
function TrendingUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  )
}
function TrendingDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
  )
}
function Wallet(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
  )
}
