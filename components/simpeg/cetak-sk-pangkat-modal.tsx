"use client"

import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Award } from "lucide-react"
import Image from "next/image"

interface CetakSKPangkatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: {
    nama: string
    nik: string
    jabatan?: string
    unit?: string
    pangkatLama: string
    golonganLama: string
    pangkatBaru: string
    golonganBaru: string
    tmtBaru: string
    tanggalPengajuan?: string
    keterangan?: string
  } | null
}

export function CetakSKPangkatModal({ open, onOpenChange, data }: CetakSKPangkatModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)

  if (!data) return null

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
  const nomorSK = `SK.823/${nikSafe.slice(-4)}/DIR-TAR/${new Date().getFullYear()}`
  const tanggalHariIni = formatTanggalIndo(new Date().toISOString().split("T")[0])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Surat Keputusan (SK) Kenaikan Pangkat Reguler
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm h-8 px-3"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Cetak SK Resmi
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
                  Telepon: (0370) 654321 • Email: sekretariat@pdamtiara.co.id
                </p>
              </div>
            </div>

            {/* Judul Keputusan Direksi */}
            <div className="text-center space-y-1 font-sans">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                KEPUTUSAN DIREKSI PERUMDA AIR MINUM TIRTA ARDHIA RINJANI
              </h3>
              <p className="text-xs font-mono font-semibold text-slate-700">NOMOR: {nomorSK}</p>
              <h4 className="text-xs font-bold tracking-tight text-slate-900 pt-1 uppercase">
                TENTANG
                <br />
                KENAIKAN PANGKAT REGULER PEGAWAI
              </h4>
            </div>

            {/* Konsiderans: Menimbang & Mengingat */}
            <div className="space-y-2 text-xs font-sans leading-relaxed text-slate-800">
              <table className="w-full">
                <tbody>
                  <tr className="align-top">
                    <td className="w-24 font-bold text-slate-700">Menimbang</td>
                    <td className="w-4">:</td>
                    <td className="space-y-1">
                      <p>a. Bahwa Pegawai yang namanya tercantum dalam keputusan ini telah memenuhi syarat masa kerja, prestasi kerja, dan dedikasi untuk dinaikkan pangkatnya setingkat lebih tinggi;</p>
                      <p>b. Bahwa untuk tertib administrasi dan pembinaan karier pegawai, dipandang perlu menerbitkan Surat Keputusan Kenaikan Pangkat.</p>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <td className="pt-2 font-bold text-slate-700">Mengingat</td>
                    <td className="pt-2">:</td>
                    <td className="pt-2 space-y-1">
                      <p>1. Peraturan Pemerintah Republik Indonesia tentang Badan Usaha Milik Daerah (BUMD);</p>
                      <p>2. Peraturan Daerah tentang Pendirian Perumda Air Minum Tirta Ardhia Rinjani;</p>
                      <p>3. Peraturan Direksi tentang Kepegawaian dan Sistem Remunerasi.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* MEMUTUSKAN */}
            <div className="text-center font-sans font-bold text-xs tracking-wider uppercase text-slate-900 py-1">
              MEMUTUSKAN
            </div>

            <div className="space-y-3 font-sans text-xs text-slate-800">
              <p className="font-semibold text-slate-900">Menetapkan:</p>

              {/* Data Pegawai */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Nama Pegawai</span>
                  <span className="col-span-2 font-bold text-slate-900">{data.nama}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">NIK</span>
                  <span className="col-span-2 font-mono font-medium text-slate-800">{data.nik}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Unit Kerja / Jabatan</span>
                  <span className="col-span-2 text-slate-800">{data.unit || "Umum"} • {data.jabatan || "-"}</span>
                </div>
              </div>

              {/* Tabel Penyesuaian Pangkat */}
              <table className="w-full border-collapse border border-slate-300 text-xs text-center">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="border border-slate-300 py-2 px-3 text-left">Status</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Pangkat</th>
                    <th className="border border-slate-300 py-2 px-3 text-center">Golongan / Ruang</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-medium text-slate-500">Pangkat Lama</td>
                    <td className="border border-slate-300 py-2 px-3 text-left text-slate-700">{data.pangkatLama}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono font-medium text-slate-700">{data.golonganLama}</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="border border-slate-300 py-2.5 px-3 text-left font-bold text-emerald-800">Pangkat Baru</td>
                    <td className="border border-slate-300 py-2.5 px-3 text-left font-bold text-emerald-900">{data.pangkatBaru}</td>
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{data.golonganBaru}</td>
                  </tr>
                </tbody>
              </table>

              <p>
                Terhitung Mulai Tanggal (TMT): <strong className="text-slate-900">{formatTanggalIndo(data.tmtBaru)}</strong>, 
                kepada pegawai yang bersangkutan diberikan gaji dan hak-hak kedinasan lainnya sesuai ketentuan kepangkatan yang baru.
              </p>
            </div>

            {/* Tanda Tangan */}
            <div className="pt-6 flex justify-end font-sans text-xs">
              <div className="w-64 text-center space-y-16">
                <div>
                  <p>Ditetapkan di: Praya</p>
                  <p>Pada tanggal: {tanggalHariIni}</p>
                  <p className="font-bold text-slate-800 mt-2">DIREKTUR UTAMA</p>
                </div>
                <div>
                  <p className="font-bold underline text-slate-900">Bambang Supratomo</p>
                  <p className="text-slate-500 text-[11px]">NIK. 232432</p>
                </div>
              </div>
            </div>

            {/* Salinan */}
            <div className="pt-4 border-t border-slate-200 text-[11px] font-sans text-slate-500">
              <p className="font-semibold text-slate-600">Salinan Keputusan ini disampaikan kepada:</p>
              <ol className="list-decimal pl-4 space-y-0.5 mt-0.5">
                <li>Bupati / Pembina BUMD</li>
                <li>Dewan Pengawas Perumda Air Minum Tirta Ardhia Rinjani</li>
                <li>Kepala Bagian Keuangan</li>
                <li>Pegawai yang bersangkutan untuk dipergunakan sebagaimana mestinya.</li>
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
