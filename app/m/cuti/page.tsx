"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus, Loader2, CalendarDays, CheckCircle2, Clock,
  XCircle, ArrowLeft, X, Camera, UploadCloud, FileText,
  Paperclip, Trash2, Eye, ExternalLink, ShieldCheck, Download
} from "lucide-react"
import { getCutiList, createCuti } from "@/lib/actions/cuti"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { compressImageForMobile, formatFileSize } from "@/lib/utils/image-compression"

const statusStyle: Record<string, { label: string; class: string; icon: any }> = {
  PENDING:  { label: "Menunggu",  class: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",  icon: Clock },
  APPROVED: { label: "Disetujui", class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak",   class: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",      icon: XCircle },
}

export default function MobileCuti() {
  const { status } = useSession()
  const router = useRouter()
  const [cutiList, setCutiList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_m_cuti")
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_m_cuti")
        if (cached) return false
      } catch {}
    }
    return true
  })
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Attachment State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    jenisCuti: "Cuti Sakit",
    tanggalMulai: "",
    tanggalSelesai: "",
    alasan: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined" && !navigator.onLine) return
      router.push("/login")
    }
    if (status === "authenticated") fetchCuti()
  }, [status])

  const fetchCuti = async () => {
    try {
      const res = await getCutiList()
      if (res.data) {
        setCutiList(res.data)
        try {
          localStorage.setItem("cached_m_cuti", JSON.stringify(res.data))
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Batas 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 15MB")
      return
    }

    let finalFile = file

    if (file.type.startsWith("image/")) {
      const toastId = toast.loading("Mengompresi foto bukti...")
      try {
        const comp = await compressImageForMobile(file, 1280, 1280, 0.8)
        finalFile = comp.file
        if (comp.savedPercent > 0) {
          toast.success(`Foto terkompresi hemat ${comp.savedPercent}% (${formatFileSize(comp.compressedSize)})`, { id: toastId })
        } else {
          toast.dismiss(toastId)
        }
      } catch {
        toast.dismiss(toastId)
      }
    } else {
      toast.success(`Dokumen "${file.name}" (${formatFileSize(file.size)}) dipilih`)
    }

    setSelectedFile(finalFile)
    if (finalFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(finalFile)
      setFilePreviewUrl(url)
    } else {
      setFilePreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setSelectedFile(null)
    setFilePreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!form.tanggalMulai || !form.tanggalSelesai || !form.alasan) {
      toast.error("Semua field wajib diisi")
      return
    }

    setSubmitting(true)
    const toastId = toast.loading(selectedFile ? "Mengunggah foto surat dokter & mengirim..." : "Mengirim pengajuan cuti...")

    try {
      let dokumenUrl: string | null = null

      // 1. Unggah file jika ada lampiran surat dokter
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadRes = await fetch("/api/cuti/upload", {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal mengunggah foto surat dokter.")
        }
        dokumenUrl = uploadData.url
      }

      // 2. Simpan pengajuan cuti ke database
      const res = await createCuti({
        ...form,
        dokumenUrl,
      })

      if ((res as any).error) throw new Error((res as any).error)

      toast.success("Pengajuan cuti & lampiran berhasil dikirim!", { id: toastId })
      setForm({ jenisCuti: "Cuti Sakit", tanggalMulai: "", tanggalSelesai: "", alasan: "" })
      handleRemoveFile()
      setShowForm(false)
      fetchCuti()
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan saat mengajukan cuti", { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] pb-24 font-sans">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Cuti & Izin</h1>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-2xs active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Ajukan Cuti & Izin
        </button>
      </div>

      {/* List Permohonan */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : cutiList.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <CalendarDays className="mx-auto h-10 w-10 mb-2.5 opacity-30 stroke-[1.5]" />
            <p className="text-sm font-medium">Belum ada pengajuan cuti</p>
          </div>
        ) : (
          cutiList.map(c => {
            const s = statusStyle[c.status] || statusStyle.PENDING
            const Icon = s.icon

            return (
              <div 
                key={c.id} 
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{c.jenisCuti?.replace("_", " ")}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                      {format(new Date(c.tanggalMulai), "d MMM", { locale: idLocale })} –{" "}
                      {format(new Date(c.tanggalSelesai), "d MMM yyyy", { locale: idLocale })}
                    </p>
                    {c.alasan && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 line-clamp-2">
                        {c.alasan}
                      </p>
                    )}
                  </div>
                  <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0", s.class)}>
                    <Icon className="h-3 w-3" />{s.label}
                  </span>
                </div>

                {/* Lampiran Surat Dokter / Bukti Pendukung */}
                {c.dokumenUrl && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingDoc({ url: c.dokumenUrl, title: `Surat Bukti ${c.jenisCuti?.replace("_", " ")}` })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/20 active:scale-95 transition-all"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>Lihat Surat Dokter / Bukti</span>
                      <Eye className="h-3 w-3 ml-0.5 opacity-70" />
                    </button>
                    <span className="text-[10px] text-zinc-400 font-medium">Ada Dokumen</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Sheet Form Pengajuan Cuti */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-5 sm:p-6 max-h-[90vh] overflow-y-auto border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-4">
            
            {/* Header Dialog */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ajukan Permohonan Cuti & Izin</h2>
                <p className="text-[11px] text-zinc-400">Lengkapi formulir & lampiran bukti jika sakit</p>
              </div>
              <button 
                onClick={() => {
                  setShowForm(false)
                  handleRemoveFile()
                }} 
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Hidden Input Files */}
            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={handleFileChange} 
            />

            <div className="space-y-3.5">
              {/* Jenis Cuti */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jenis Cuti</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={form.jenisCuti}
                  onChange={e => setForm(p => ({ ...p, jenisCuti: e.target.value }))}
                >
                  {["Cuti Sakit", "Cuti Tahunan", "Izin Tidak Masuk", "Cuti Melahirkan", "Cuti Besar"].map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                {form.jenisCuti === "Cuti Sakit" && (
                  <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Cuti Sakit wajib melampirkan surat keterangan dokter.
                  </p>
                )}
              </div>

              {/* Tanggal Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Mulai</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={form.tanggalMulai} 
                    onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Selesai</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={form.tanggalSelesai} 
                    onChange={e => setForm(p => ({ ...p, tanggalSelesai: e.target.value }))} 
                  />
                </div>
              </div>

              {/* Alasan */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Keterangan / Alasan</label>
                <textarea 
                  rows={2} 
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  placeholder="Tuliskan keterangan detail alasan cuti..."
                  value={form.alasan} 
                  onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} 
                />
              </div>

              {/* SECTION: UNGGAH FOTO SURAT DOKTER / BUKTI */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      Foto Surat Dokter / Bukti Izin
                    </label>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {form.jenisCuti === "Cuti Sakit" 
                        ? "Wajib melampirkan foto surat keterangan dokter dari faskes" 
                        : "Lampiran bukti pendukung (Opsional, maks. 10MB)"}
                    </p>
                  </div>

                  {form.jenisCuti === "Cuti Sakit" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Penting
                    </span>
                  )}
                </div>

                {/* Jika Belum Ada File Dipilih: Tampilkan Tombol Kamera & Galeri */}
                {!selectedFile ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 active:scale-95 transition-all text-center group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Camera className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Foto Kamera</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5">Buka Kamera HP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 active:scale-95 transition-all text-center group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Pilih File</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5">Galeri Foto / PDF</span>
                    </button>
                  </div>
                ) : (
                  /* Jika File Sudah Dipilih: Tampilkan Pratinjau */
                  <div className="rounded-xl p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                    {filePreviewUrl ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-black/5">
                        <img 
                          src={filePreviewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Dokumen Terlampir</span>
                      </div>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate mt-0.5" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all shrink-0"
                      title="Hapus / Ambil Ulang"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tombol Kirim */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-2 rounded-xl bg-zinc-900 dark:bg-white py-3.5 font-bold text-xs text-white dark:text-zinc-900 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Pengajuan...</span>
                  </>
                ) : (
                  <span>Kirim Permohonan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP PREVIEW DOKUMEN / SURAT DOKTER FULLSCREEN */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg flex items-center justify-between text-white pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="h-4 w-4 text-blue-400 shrink-0" />
              <p className="text-xs font-bold truncate">{viewingDoc.title}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <a 
                href={viewingDoc.url} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                title="Buka Dokumen Asli"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button 
                onClick={() => setViewingDoc(null)} 
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white active:scale-95 transition-all"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="w-full max-w-lg flex-1 max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 border border-white/10 p-2">
            {viewingDoc.url.toLowerCase().endsWith(".pdf") || viewingDoc.url.includes("application/pdf") ? (
              <iframe 
                src={viewingDoc.url} 
                title={viewingDoc.title} 
                className="w-full h-full rounded-xl border-none" 
              />
            ) : (
              <img 
                src={viewingDoc.url} 
                alt="Surat Dokter" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              />
            )}
          </div>

          <div className="mt-3 text-center">
            <button 
              onClick={() => setViewingDoc(null)}
              className="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold active:scale-95 transition-all"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
