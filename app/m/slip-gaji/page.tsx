"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Download, ChevronDown, TrendingUp, TrendingDown, Wallet, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { getMyPayroll } from "@/lib/actions/payroll"
import { generateA5SlipGajiPdf } from "@/lib/cetak-slip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

const bulanList = [
  { value: "apr-2026", label: "April 2026" },
  { value: "mar-2026", label: "Maret 2026" },
  { value: "feb-2026", label: "Februari 2026" },
  { value: "jan-2026", label: "Januari 2026" },
  { value: "des-2025", label: "Desember 2025" },
  { value: "nov-2025", label: "November 2025" },
]

interface SlipData {
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
  lembur: number
  gajiBersih: number
  status: string
}

export default function MobileSlipGaji() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [slipData, setSlipData] = useState<SlipData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026")
  const [showPeriodPicker, setShowPeriodPicker] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status])

  const fetchSlip = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyPayroll(selectedPeriod)
      setSlipData(res as SlipData)
    } catch {
      setSlipData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    if (status === "authenticated") fetchSlip()
  }, [status, fetchSlip])

  const handleDownloadPdf = async () => {
    if (!slipData) return
    const periodLabel = bulanList.find(b => b.value === selectedPeriod)?.label || selectedPeriod
    const loadingToast = toast.loading("Mempersiapkan dokumen PDF...")
    try {
      await generateA5SlipGajiPdf(slipData as any, periodLabel)
      toast.success("Slip gaji berhasil diunduh", { id: loadingToast })
    } catch {
      toast.error("Gagal men-generate PDF", { id: loadingToast })
    }
  }

  const periodLabel = bulanList.find(b => b.value === selectedPeriod)?.label || selectedPeriod

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] pb-24 font-sans">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Slip Gaji</h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Rincian & Dokumen Penggajian</p>
          </div>
        </div>

        {slipData && slipData.status !== "draft" && (
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-semibold shadow-2xs active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
        )}
      </div>

      {/* Period Selector */}
      <div className="px-4 pt-4 max-w-md mx-auto">
        <button
          onClick={() => setShowPeriodPicker(!showPeriodPicker)}
          className="w-full flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 text-xs shadow-2xs active:scale-98 transition-all"
        >
          <span className="text-zinc-500 dark:text-zinc-400">
            Periode: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{periodLabel}</strong>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", showPeriodPicker && "rotate-180")} />
        </button>

        {showPeriodPicker && (
          <div className="mt-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in-50 zoom-in-95">
            {bulanList.map(b => (
              <button
                key={b.value}
                onClick={() => { setSelectedPeriod(b.value); setShowPeriodPicker(false) }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between",
                  selectedPeriod === b.value 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold" 
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                )}
              >
                <span>{b.label}</span>
                {selectedPeriod === b.value && <CheckCircle2 className="h-3.5 w-3.5 text-zinc-900 dark:text-white" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 mt-3.5 space-y-3.5 max-w-md mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            <p className="text-xs text-zinc-500">Memuat rincian slip gaji...</p>
          </div>
        ) : !slipData ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6">
            <AlertCircle className="h-10 w-10 mx-auto mb-2.5 text-amber-500 opacity-60" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Data Tidak Ditemukan</p>
            <p className="text-xs mt-1">Belum ada slip gaji yang dirilis untuk periode {periodLabel}.</p>
          </div>
        ) : (
          <>
            {/* Take Home Pay Card */}
            <div className="rounded-2xl p-5 bg-zinc-950 text-white border border-zinc-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-zinc-300">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">Take Home Pay (Gaji Bersih)</span>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  slipData.status === "draft"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                )}>
                  {slipData.status === "draft" ? "Draft" : "✓ Disahkan"}
                </span>
              </div>

              <p className="text-2xl font-bold tracking-tight mt-3 tabular-nums">
                {formatCurrency(slipData.gajiBersih)}
              </p>
            </div>

            {/* Data Pegawai */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs space-y-2.5">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Informasi Karyawan
              </p>
              <div className="space-y-2 text-xs">
                <Row label="Nama" value={slipData.nama} />
                <Row label="NIK" value={slipData.nik} />
                <Row label="Unit Kerja" value={slipData.unit} />
                <Row label="Golongan" value={slipData.golongan} />
                <Row label="Bank / Rekening" value={`${slipData.bank || "-"} · ${slipData.noRekening || "-"}`} />
              </div>
            </div>

            {/* Penerimaan */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Komponen Penerimaan
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <RowMoney label="Gaji Pokok" amount={slipData.gajiPokok} />
                <RowMoney label="Tunjangan" amount={slipData.tunjangan} />
                {slipData.lembur > 0 && <RowMoney label="Uang Lembur" amount={slipData.lembur} />}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <RowMoney 
                    label="Total Penerimaan Bruto" 
                    amount={slipData.gajiPokok + slipData.tunjangan + slipData.lembur} 
                    bold 
                    accent="emerald" 
                  />
                </div>
              </div>
            </div>

            {/* Potongan */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Komponen Potongan
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <RowMoney label="Total Potongan" amount={slipData.potongan} bold accent="rose" />
              </div>
            </div>

            {/* Download Button */}
            {slipData.status !== "draft" && (
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white py-3.5 font-semibold text-xs text-white dark:text-zinc-900 shadow-2xs active:scale-98 transition-all"
              >
                <Download className="h-4 w-4" />
                Download Slip Gaji (Format PDF A5)
              </button>
            )}

            {slipData.status === "draft" && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold">Menunggu Pengesahan HRD</p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                  Slip gaji ini masih berupa draft sementara. File resmi PDF akan tersedia setelah diverifikasi bagian keuangan.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-right">{value || "-"}</span>
    </div>
  )
}

function RowMoney({ label, amount, bold, accent }: { label: string; amount: number; bold?: boolean; accent?: string }) {
  const colorClass = accent === "emerald" 
    ? "text-emerald-600 dark:text-emerald-400" 
    : accent === "rose" 
    ? "text-rose-600 dark:text-rose-400" 
    : "text-zinc-900 dark:text-zinc-100"

  return (
    <div className="flex justify-between items-center py-0.5">
      <span className={cn(bold ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}>{label}</span>
      <span className={cn("tabular-nums", bold ? `font-bold ${colorClass}` : "font-medium text-zinc-900 dark:text-zinc-100")}>
        {formatCurrency(amount)}
      </span>
    </div>
  )
}
