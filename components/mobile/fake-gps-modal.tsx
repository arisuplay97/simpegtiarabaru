"use client"

import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react"

interface FakeGpsModalProps {
  isOpen: boolean
  reason: string
  onCloseAndRetry: () => void
}

export function FakeGpsModal({ isOpen, reason, onCloseAndRetry }: FakeGpsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-rose-500/30 dark:border-rose-900/60 p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Top danger glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600" />
        
        {/* Animated Warning Icon */}
        <div className="relative mb-4 mt-2">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
          <div className="relative h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shadow-xs">
            <ShieldAlert className="h-8 w-8 stroke-[2]" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Aplikasi Fake GPS Terdeteksi!
        </h3>
        
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
          Sistem keamanan presensi menolak koordinat tidak sah
        </p>

        {reason && (
          <div className="w-full mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 text-left text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">Indikasi:</p>
            {reason}
          </div>
        )}

        <div className="w-full mt-4 text-left bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/15 rounded-xl p-3.5 space-y-2 text-xs">
          <p className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            Langkah untuk melanjutkan:
          </p>
          <ol className="list-decimal list-inside text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 pl-1">
            <li>Tutup & hentikan aplikasi Fake GPS di HP Anda.</li>
            <li>Buka <strong>Pengaturan HP &gt; Opsi Pengembang</strong>.</li>
            <li>Cari <strong>Pilih aplikasi lokasi palsu</strong> lalu pilih <strong>Tidak Ada (None)</strong>.</li>
            <li>Pastikan GPS HP disetel ke Akurasi Tinggi.</li>
          </ol>
        </div>

        <button
          onClick={onCloseAndRetry}
          className="w-full mt-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-3.5 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Saya Sudah Mematikan Fake GPS (Coba Lagi)
        </button>
      </div>
    </div>
  )
}
