"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Download, ChevronDown, TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react"
import { getMyPayroll } from "@/lib/actions/payroll"
import { downloadSimplePdf } from "@/lib/demo-files"
import { generateA5SlipGajiPdf } from "@/lib/cetak-slip"
import { toast } from "sonner"

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
  const [debugError, setDebugError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026")
  const [showPeriodPicker, setShowPeriodPicker] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status])

  const fetchSlip = useCallback(async () => {
    setLoading(true)
    setDebugError(null)
    try {
      console.log("Fetching slip for period:", selectedPeriod)
      const res = await getMyPayroll(selectedPeriod)
      console.log("Result:", res)
      if (res === null) {
         setDebugError("FUNGSI SERVER: getMyPayroll mengembalikan nilai NULL. Artinya email session tidak cocok dengan email Pegawai di DB, atau data tidak ada.")
      }
      setSlipData(res as SlipData)
    } catch (e: any) {
      console.error("Error fetching slip:", e)
      setDebugError("Exception Catch: " + (e?.message || JSON.stringify(e)))
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
    const loadingToast = toast.loading("Mempersiapkan PDF...")
    try {
      await generateA5SlipGajiPdf(slipData as any, periodLabel)
      toast.success("PDF slip gaji (A5) berhasil diunduh", { id: loadingToast })
    } catch (e) {
      toast.error("Gagal men-generate PDF", { id: loadingToast })
    }
  }

  const periodLabel = bulanList.find(b => b.value === selectedPeriod)?.label || selectedPeriod

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b border-border px-4 pb-4 flex items-center"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
        }}
      >
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Slip Gaji</h1>
          <p className="text-xs text-blue-200">Lihat & download slip gaji Anda</p>
        </div>
        {slipData && slipData.status !== "draft" && (
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 rounded-xl bg-white/20 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        )}
      </div>

      {/* Period Selector */}
      <div className="px-4 pt-4">
        <button
          onClick={() => setShowPeriodPicker(!showPeriodPicker)}
          className="w-full flex items-center justify-between rounded-2xl bg-card border border-border px-4 py-3 text-sm font-medium shadow-sm active:scale-[0.98] transition-transform"
        >
          <span>Periode: <span className="text-primary font-semibold">{periodLabel}</span></span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPeriodPicker ? "rotate-180" : ""}`} />
        </button>

        {showPeriodPicker && (
          <div className="mt-2 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
            {bulanList.map(b => (
              <button
                key={b.value}
                onClick={() => { setSelectedPeriod(b.value); setShowPeriodPicker(false) }}
                className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-b-0 transition-colors ${
                  selectedPeriod === b.value ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Mengambil data slip gaji...</p>
          </div>
        ) : !slipData ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <p className="text-muted-foreground">Data slip gaji tidak tersedia</p>
            <p className="text-xs text-muted-foreground mt-1">Pastikan Anda terdaftar sebagai pegawai aktif</p>
            {debugError && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 text-xs rounded-lg text-left break-words">
                <strong>Debug Info:</strong><br/>
                {debugError}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Take Home Pay Card */}
            <div
              className="rounded-3xl p-5 text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="text-sm text-blue-200 font-medium">Take Home Pay</span>
              </div>
              <p className="text-3xl font-bold tracking-tight mt-2">{formatCurrency(slipData.gajiBersih)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  slipData.status === "draft"
                    ? "bg-amber-400/30 text-amber-200"
                    : "bg-emerald-400/30 text-emerald-200"
                }`}>
                  {slipData.status === "draft" ? "Draft / Belum Disahkan" : "✓ Lunas"}
                </span>
              </div>
            </div>

            {/* Data Pegawai */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Data Pegawai</p>
              <div className="space-y-2.5 text-sm">
                <Row label="Nama" value={slipData.nama} />
                <Row label="NIK" value={slipData.nik} />
                <Row label="Unit Kerja" value={slipData.unit} />
                <Row label="Golongan" value={slipData.golongan} />
                <Row label="Bank" value={slipData.bank} />
                <Row label="No. Rekening" value={slipData.noRekening} />
              </div>
            </div>

            {/* Penerimaan */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Penerimaan</p>
              </div>
              <div className="space-y-2.5 text-sm">
                <RowMoney label="Gaji Pokok" amount={slipData.gajiPokok} />
                <RowMoney label="Tunjangan" amount={slipData.tunjangan} />
                {slipData.lembur > 0 && <RowMoney label="Lembur" amount={slipData.lembur} />}
                <div className="border-t border-border pt-2.5">
                  <RowMoney label="Total Penerimaan" amount={slipData.gajiPokok + slipData.tunjangan + slipData.lembur} bold accent="emerald" />
                </div>
              </div>
            </div>

            {/* Potongan */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Potongan</p>
              </div>
              <div className="space-y-2.5 text-sm">
                <RowMoney label="Total Potongan" amount={slipData.potongan} bold accent="rose" />
              </div>
            </div>

            {/* Download Button */}
            {slipData.status !== "draft" && (
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white shadow-md active:scale-[0.98] transition-transform"
              >
                <Download className="h-5 w-5" />
                Download Slip Gaji PDF
              </button>
            )}

            {slipData.status === "draft" && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Slip Gaji Belum Disahkan</p>
                <p className="text-xs text-amber-600">Payroll periode ini masih berstatus draft. Download PDF akan tersedia setelah HRD menyetujui payroll.</p>
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
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function RowMoney({ label, amount, bold, accent }: { label: string; amount: number; bold?: boolean; accent?: string }) {
  const colorClass = accent === "emerald" ? "text-emerald-700" : accent === "rose" ? "text-rose-700" : "text-foreground"
  return (
    <div className="flex justify-between">
      <span className={bold ? `font-semibold ${colorClass}` : "text-muted-foreground"}>{label}</span>
      <span className={bold ? `font-bold ${colorClass}` : "font-medium text-foreground"}>{formatCurrency(amount)}</span>
    </div>
  )
}
