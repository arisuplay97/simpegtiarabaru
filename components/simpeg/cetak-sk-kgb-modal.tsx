"use client"

import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Download, X, Building2, CheckCircle2 } from "lucide-react"
import Image from "next/image"

interface CetakSKKGBModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: {
    nama: string
    nik: string
    jabatan?: string
    golongan?: string
    unit?: string
    tmtBaru: string
    gajiLama: number
    gajiBaru: number
    tanggalPengajuan?: string
    keterangan?: string
    mkg?: number
  } | null
}

export function CetakSKKGBModal({ open, onOpenChange, data }: CetakSKKGBModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)

  if (!data) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val)
  }

  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d)
    } catch {
      return dateStr
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const nikSafe = data.nik || "0000"
  const nomorSurat = `823.3/KGB-${nikSafe.slice(-4)}/PDAM-TAR/${new Date().getFullYear()}`
  const tanggalHariIni = formatTanggalIndo(new Date().toISOString().split("T")[0])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            Surat Pemberitahuan Kenaikan Gaji Berkala (KGB)
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm h-8 px-3"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Cetak Dokumen
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Document Area */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 font-serif leading-relaxed text-sm" ref={printAreaRef}>
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .print-area, .print-area * {
                visibility: visible !important;
              }
              .print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

          <div className="print-area max-w-2xl mx-auto space-y-6">
            {/* KOP RESMI */}
            <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-900">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src="/LOGOBARU.png"
                  alt="Logo Perumda"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if not found
                    (e.target as any).style.display = "none"
                  }}
                />
              </div>
              <div className="text-center flex-1 pr-16 font-sans">
                <h3 className="text-xs font-semibold tracking-wider text-slate-600 uppercase">Pemerintah Kabupaten / Kota</h3>
                <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                  PERUMDA AIR MINUM TIRTA ARDHIA RINJANI
                </h2>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Jl. Pejanggik No. 12, Praya, Lombok Tengah, Nusa Tenggara Barat
                </p>
                <p className="text-[10px] text-slate-500">
                  Telepon: (0370) 654321 • Email: sekretariat@pdamtiara.co.id • Website: www.pdamtiara.co.id
                </p>
              </div>
            </div>

            {/* Nomor & Perihal */}
            <div className="flex justify-between items-start text-xs font-sans mt-4">
              <table className="space-y-1">
                <tbody>
                  <tr>
                    <td className="w-20 font-medium text-slate-600">Nomor</td>
                    <td className="w-4">:</td>
                    <td className="font-semibold text-slate-900 font-mono">{nomorSurat}</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-slate-600">Sifat</td>
                    <td>:</td>
                    <td>Penting</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-slate-600">Lampiran</td>
                    <td>:</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-slate-600">Perihal</td>
                    <td>:</td>
                    <td className="font-bold underline text-slate-900">Pemberitahuan Kenaikan Gaji Berkala</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-right text-xs">
                <p>Praya, {tanggalHariIni}</p>
                <p className="mt-4 text-slate-700">Kepada Yth.</p>
                <p className="font-bold text-slate-900">Bagian Keuangan & Akuntansi</p>
                <p className="text-slate-600">Perumda Air Minum Tirta Ardhia Rinjani</p>
                <p className="text-slate-600">di Tempat</p>
              </div>
            </div>

            {/* Isi Surat */}
            <div className="space-y-3.5 text-justify text-xs leading-relaxed font-sans text-slate-800">
              <p>
                Dengan telah dipenuhinya persyaratan masa kerja golongan dan penilaian kinerja yang baik sesuai dengan
                Peraturan Direksi dan ketentuan perundang-undangan ketenagakerjaan yang berlaku, dengan ini diberitahukan
                bahwa Pegawai Perumda Air Minum Tirta Ardhia Rinjani:
              </p>

              {/* Box Rincian Pegawai */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">1. Nama Pegawai</span>
                  <span className="col-span-2 font-bold text-slate-900">{data.nama}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">2. NIK / Nomor Induk</span>
                  <span className="col-span-2 font-mono font-medium text-slate-800">{data.nik}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">3. Pangkat / Golongan</span>
                  <span className="col-span-2 font-medium text-slate-800">Golongan {data.golongan || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">4. Jabatan / Unit Kerja</span>
                  <span className="col-span-2 text-slate-800">{data.jabatan || "-"} ({data.unit || "Umum"})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">5. Masa Kerja Golongan</span>
                  <span className="col-span-2 font-medium text-slate-800">{data.mkg || 2} Tahun</span>
                </div>
              </div>

              <p>
                Diberikan <strong>Kenaikan Gaji Berkala (KGB)</strong> dengan rincian penyesuaian penghasilan pokok sebagai berikut:
              </p>

              {/* Tabel Komparasi */}
              <table className="w-full border-collapse border border-slate-300 text-xs text-center font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="border border-slate-300 py-2 px-3 text-left">Komponen</th>
                    <th className="border border-slate-300 py-2 px-3 text-right">Gaji Pokok Lama</th>
                    <th className="border border-slate-300 py-2 px-3 text-right bg-emerald-50 text-emerald-900">Gaji Pokok Baru</th>
                    <th className="border border-slate-300 py-2 px-3 text-right">Kenaikan Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 py-2.5 px-3 text-left font-medium text-slate-800">
                      Gaji Pokok Bulanan
                    </td>
                    <td className="border border-slate-300 py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatRupiah(data.gajiLama)}
                    </td>
                    <td className="border border-slate-300 py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      {formatRupiah(data.gajiBaru)}
                    </td>
                    <td className="border border-slate-300 py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                      +{formatRupiah(data.gajiBaru - data.gajiLama)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-medium text-slate-800">
                      Terhitung Mulai Tanggal (TMT)
                    </td>
                    <td colSpan={3} className="border border-slate-300 py-2 px-3 text-left font-semibold text-slate-900">
                      {formatTanggalIndo(data.tmtBaru)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                Diharapkan kepada Bagian Keuangan untuk dapat membayarkan penghasilan yang bersangkutan sesuai dengan ketentuan
                gaji baru terhitung mulai tanggal tersebut di atas.
              </p>
            </div>

            {/* Tanda Tangan */}
            <div className="pt-6 flex justify-end font-sans text-xs">
              <div className="w-64 text-center space-y-16">
                <div>
                  <p className="font-semibold text-slate-800">DIREKTUR UTAMA</p>
                  <p className="text-slate-600">PERUMDA AIR MINUM TIRTA ARDHIA RINJANI</p>
                </div>
                <div>
                  <p className="font-bold underline text-slate-900">Ir. Bambang Trihatmojo, M.M.</p>
                  <p className="text-slate-500 text-[11px]">NIK. 19750812 200101 1 002</p>
                </div>
              </div>
            </div>

            {/* Tembusan */}
            <div className="pt-4 border-t border-slate-200 text-[11px] font-sans text-slate-500">
              <p className="font-semibold text-slate-600">Tembusan disampaikan kepada Yth:</p>
              <ol className="list-decimal pl-4 space-y-0.5 mt-0.5">
                <li>Dewan Pengawas Perumda Air Minum Tirta Ardhia Rinjani</li>
                <li>Kepala Bagian SDM & Umum (Arsip Kepegawaian)</li>
                <li>Pegawai yang bersangkutan</li>
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
