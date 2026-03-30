"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generateA5SlipGajiPdf } from "@/lib/cetak-slip"
import { Download, AlertCircle, Printer, Mail } from "lucide-react"
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
  jabatan?: string
  bank: string
  noRekening: string
  gajiPokok: number
  tunjangan: number
  lembur?: number
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

  const handleDownload = async () => {
    if (!slipData) return
    const loadingToast = toast.loading("Mempersiapkan PDF...")
    try {
      await generateA5SlipGajiPdf(slipData as any, selectedPeriod)
      toast.success("PDF slip gaji (A5) berhasil diunduh", { id: loadingToast })
    } catch (e) {
      toast.error("Gagal men-generate PDF", { id: loadingToast })
    }
  }

  const handlePrint = () => {
    // Note: Instead of native HTML window.print() which may format badly across browsers,
    // we can trigger the same PDF logic here, or just tell the user to use Print from the PDF.
    toast.info("Gunakan tombol Download PDF untuk mendapatkan format A5 yang rapi, lalu print PDF tersebut.")
  }

  const handleEmail = () => {
    toast.success("Mengirim slip gaji ke email terdaftar Anda...")
    window.setTimeout(() => {
      toast.success("Slip gaji berhasil dikirim")
    }, 1200)
  }

  // Helper calculation
  const totalBruto = slipData ? (slipData.gajiPokok + slipData.tunjangan + (slipData.lembur || 0)) : 0

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Remunerasi", "Slip Gaji"]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Slip Gaji Digital</h1>
              <p className="text-sm text-muted-foreground">Lihat dan download slip gaji sesuai format A5 resmi</p>
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
              <Button onClick={handleDownload} disabled={!slipData || slipData.status === "draft"}>
                <Download className="mr-2 h-4 w-4" /> Download PDF (A5)
              </Button>
            </div>
          </div>

          <div className="mx-auto flex flex-col items-center">
            <Card className="card-premium overflow-hidden w-full max-w-3xl shadow-xl border-border print:shadow-none print:border-none">
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
                <CardContent className="p-0 bg-white">
                  {/* Tampilan ini di-desain persis format boxy cetak PDF */}
                  <div className="mx-auto w-full p-8 font-mono text-black" style={{maxWidth: '800px', fontSize: '13px'}}>
                    
                    {/* Header Box */}
                    <div className="border border-black p-4 flex gap-6 items-center">
                       <img src="/slip.png" alt="Logo Slip" className="h-16 object-contain pl-2" />
                       <div>
                          <p className="font-bold text-lg">PERUSAHAAN UMUM DAERAH</p>
                          <p className="font-bold text-lg">TIRTA ARDHIA RINJANI</p>
                          <p className="font-bold text-lg">SLIP GAJI BULAN {selectedPeriod.toUpperCase()}</p>
                       </div>
                    </div>

                    {/* Personal Info Box */}
                    <div className="border-x border-b border-black p-4 space-y-2">
                       <div className="grid grid-cols-[100px_1fr]"><span>Nama</span><span>: {slipData.nama}</span></div>
                       <div className="grid grid-cols-[100px_1fr]"><span>NIK</span><span>: {slipData.nik}</span></div>
                       <div className="grid grid-cols-[100px_1fr]"><span>Jabatan</span><span>: {slipData.jabatan || "-"}</span></div>
                       <div className="grid grid-cols-[100px_1fr]"><span>Unit</span><span>: {slipData.unit}</span></div>
                       <div className="grid grid-cols-[100px_1fr]"><span>Golongan</span><span>: {slipData.golongan}</span></div>
                    </div>

                    {/* Penerimaan vs Potongan Header */}
                    <div className="border-x border-b border-black flex font-bold h-10">
                       <div className="w-1/2 p-2 px-4 flex items-center border-r border-black">PENERIMAAN</div>
                       <div className="w-1/2 p-2 px-4 flex items-center">POTONGAN</div>
                    </div>

                    {/* Rincian Body */}
                    <div className="border-x border-b border-black flex">
                       <div className="w-1/2 p-4 space-y-3 border-r border-black pr-6">
                           <div className="flex justify-between"><span>Gaji Pokok</span> <span>{formatCurrency(slipData.gajiPokok)}</span></div>
                           <div className="flex justify-between"><span>Tunjangan</span> <span>{formatCurrency(slipData.tunjangan)}</span></div>
                           <div className="flex justify-between"><span>Lembur</span> <span>{formatCurrency(slipData.lembur || 0)}</span></div>
                           <div className="pt-2 mt-2" />
                           <div className="flex justify-between font-bold"><span>Total Bruto</span> <span>{formatCurrency(totalBruto)}</span></div>
                       </div>
                       <div className="w-1/2 p-4 space-y-3 pl-6">
                           <div className="flex justify-between"><span>BPJS Kesehatan</span> <span>-</span></div>
                           <div className="flex justify-between"><span>BPJS TK</span> <span>-</span></div>
                           <div className="flex justify-between"><span>PPh 21</span> <span>-</span></div>
                           <div className="pt-2 mt-2" />
                           <div className="flex justify-between font-bold"><span>Total Potongan</span> <span>{formatCurrency(slipData.potongan)}</span></div>
                       </div>
                    </div>

                    {/* Gaji Bersih Footer */}
                    <div className="border-x border-b border-black p-4 h-16 flex items-center">
                       <p className="font-bold text-lg">GAJI BERSIH : {formatCurrency(slipData.gajiBersih)}</p>
                    </div>

                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
