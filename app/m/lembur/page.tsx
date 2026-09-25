"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Loader2, CalendarDays, CheckCircle2, Clock, XCircle, Timer, ArrowLeft, X, Camera, Image as ImageIcon, Trash2, Eye } from "lucide-react"
import { ajukanLembur, getLemburList } from "@/lib/actions/shift-lembur-fixed"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusStyle: Record<string, { label: string; class: string; icon: any }> = {
  PENDING:  { label: "Menunggu",  class: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",  icon: Clock },
  APPROVED: { label: "Disetujui", class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak",   class: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",      icon: XCircle },
}

export default function MobileLembur() {
  const { status } = useSession()
  const router = useRouter()
  
  const [pegawaiId, setPegawaiId] = useState<string | null>(null)
  const [lemburList, setLemburList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_m_lembur")
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_m_lembur")
        if (cached) return false
      } catch {}
    }
    return true
  })
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    jenis: "HARI_KERJA" as "HARI_KERJA" | "HARI_LIBUR" | "HARI_BESAR",
    tanggal: "",
    jamMulai: "",
    jamSelesai: "",
    alasan: "",
  })

  // Mandatory photo state (strictly images, no documents)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined" && !navigator.onLine) return
      router.push("/login")
    }
    if (status === "authenticated") fetchProfileAndData()
  }, [status])

  const fetchProfileAndData = async () => {
    try {
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        if (p?.id) {
          setPegawaiId(p.id)
          const lemburRes = await getLemburList({ pegawaiId: p.id })
          if (lemburRes) {
            setLemburList(lemburRes)
            try {
              localStorage.setItem("cached_m_lembur", JSON.stringify(lemburRes))
            } catch {}
          }
        }
      }
    } catch {}
    setLoading(false)
  }

  const hitungDurasi = () => {
    if (!form.jamMulai || !form.jamSelesai) return 0
    const [hM, mM] = form.jamMulai.split(":").map(Number)
    const [hS, mS] = form.jamSelesai.split(":").map(Number)
    let durasi = (hS + mS / 60) - (hM + mM / 60)
    if (durasi < 0) durasi += 24
    return Number(durasi.toFixed(1))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file foto / gambar yang diperbolehkan. Dokumen tidak diizinkan.")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 15MB")
      return
    }

    setSelectedPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setSelectedPhoto(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (galleryInputRef.current) galleryInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!pegawaiId) {
      toast.error("Profil pegawai tidak ditemukan")
      return
    }
    if (!form.tanggal || !form.jamMulai || !form.jamSelesai || !form.alasan) {
      toast.error("Semua field formulir wajib diisi")
      return
    }
    if (!selectedPhoto) {
      toast.error("Wajib melampirkan foto bukti pekerjaan lembur!")
      return
    }
    
    const durasiJam = hitungDurasi()
    if (durasiJam <= 0) {
      toast.error("Waktu mulai dan selesai tidak valid")
      return
    }

    setSubmitting(true)
    const toastId = toast.loading("Mengunggah foto bukti lembur...")

    try {
      // 1. Upload foto bukti ke server
      const formData = new FormData()
      formData.append("file", selectedPhoto)

      const uploadRes = await fetch("/api/lembur/upload", {
        method: "POST",
        body: formData,
      })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Gagal mengunggah foto bukti lembur.")
      }

      const fotoUrl = uploadData.url

      // 2. Simpan pengajuan lembur dengan fotoUrl
      toast.loading("Menyimpan pengajuan lembur...", { id: toastId })
      const res = await ajukanLembur({
        pegawaiId,
        tanggal: form.tanggal,
        jamMulai: form.jamMulai,
        jamSelesai: form.jamSelesai,
        durasiJam,
        jenis: form.jenis,
        alasan: form.alasan,
        fotoUrl,
      })

      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan lembur & foto bukti berhasil dikirim!", { id: toastId })
      setForm({ jenis: "HARI_KERJA", tanggal: "", jamMulai: "", jamSelesai: "", alasan: "" })
      handleRemovePhoto()
      setShowForm(false)
      
      setLoading(true)
      const lemburRes = await getLemburList({ pegawaiId })
      setLemburList(lemburRes || [])
      setLoading(false)
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan saat mengajukan lembur", { id: toastId })
      setLoading(false)
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
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Lembur Kerja</h1>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-2xs active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Ajukan Lembur
        </button>
      </div>

      {/* List Pengajuan Lembur */}
      <div className="px-4 mt-4 space-y-3 max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : lemburList.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <Timer className="mx-auto h-10 w-10 mb-2.5 opacity-30 stroke-[1.5]" />
            <p className="text-sm font-medium">Belum ada riwayat pengajuan lembur</p>
          </div>
        ) : (
          lemburList.map(item => {
            const s = statusStyle[item.status] || statusStyle.PENDING
            const Icon = s.icon
            return (
              <div 
                key={item.id} 
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-zinc-400" /> 
                      {item.tanggal}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md tabular-nums">
                        {item.jamMulai} - {item.jamSelesai}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                        {item.durasiJam} Jam
                      </span>
                    </div>
                  </div>
                  <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0", s.class)}>
                    <Icon className="h-3 w-3" />{s.label}
                  </span>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-xs space-y-2">
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                      {item.jenis?.replace("_", " ")}
                    </p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed">{item.alasan}</p>
                  </div>

                  {/* Foto Bukti Lembur */}
                  {item.fotoUrl && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(item.fotoUrl)}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700 hover:border-blue-400 active:scale-98 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={item.fotoUrl} 
                            alt="Bukti Lembur" 
                            className="w-9 h-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                          <div className="text-left">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                              Foto Bukti Lembur
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                              Ketuk untuk melihat foto
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Lihat</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Fullscreen Photo Modal Preview */}
      {previewModalUrl && (
        <div 
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-zinc-300">Foto Bukti Pelaksanaan Lembur</span>
            <button 
              onClick={() => setPreviewModalUrl(null)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2">
            <img 
              src={previewModalUrl} 
              alt="Bukti Lembur Full" 
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()} 
            />
          </div>
          <div className="text-center pb-4 text-xs text-zinc-400">
            Ketuk di luar gambar atau tombol silang untuk menutup
          </div>
        </div>
      )}

      {/* Bottom Sheet Form Ajukan Lembur */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
            <div className="mb-5 flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ajukan Lembur Kerja</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Lengkapi formulir dan lampirkan foto bukti pekerjaan</p>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jenis Lembur</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={form.jenis}
                  onChange={e => setForm(p => ({ ...p, jenis: e.target.value as any }))}
                >
                  <option value="HARI_KERJA">Hari Kerja Biasa</option>
                  <option value="HARI_LIBUR">Hari Libur / Akhir Pekan</option>
                  <option value="HARI_BESAR">Hari Libur Nasional / Besar</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={form.tanggal} 
                  onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jam Mulai</label>
                  <input 
                    type="time" 
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={form.jamMulai} 
                    onChange={e => setForm(p => ({ ...p, jamMulai: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jam Selesai</label>
                  <input 
                    type="time" 
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={form.jamSelesai} 
                    onChange={e => setForm(p => ({ ...p, jamSelesai: e.target.value }))} 
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tugas / Alasan Lembur</label>
                <textarea 
                  rows={3} 
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  placeholder="Deskripsikan tugas dan target pekerjaan lembur..."
                  value={form.alasan} 
                  onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} 
                />
              </div>

              {/* SECTION FOTO BUKTI LEMBUR (WAJIB, HANYA FOTO/KAMERA, TANPA DOKUMEN) */}
              <div className={cn(
                "rounded-2xl border p-3.5 space-y-2.5 transition-colors",
                !selectedPhoto 
                  ? "border-rose-300 dark:border-rose-700/80 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-400/20"
                  : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-blue-500" />
                      Foto Bukti Pekerjaan Lembur
                      <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
                    </label>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Foto dokumentasi saat lembur (hanya foto, tanpa dokumen)
                    </p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full shrink-0">
                    Wajib Foto
                  </span>
                </div>

                {/* Hidden File Inputs (Strictly Image Only) */}
                <input 
                  ref={cameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handlePhotoSelect}
                />
                <input 
                  ref={galleryInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoSelect}
                />

                {!photoPreview ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 active:scale-95 transition-all text-center group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Camera className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Buka Kamera</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5">Foto Langsung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 active:scale-95 transition-all text-center group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Galeri Foto</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5">Pilih Gambar</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-black/5">
                      <img 
                        src={photoPreview} 
                        alt="Pratinjau Foto" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {selectedPhoto?.name || "foto_lembur.jpg"}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Foto siap dikirim ({((selectedPhoto?.size || 0) / 1024).toFixed(0)} KB)
                      </p>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-[10px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium underline mt-1 flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Ganti / Hapus Foto
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-xl bg-zinc-900 dark:bg-white py-3 font-semibold text-xs text-white dark:text-zinc-900 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs mt-2"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan Lembur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
