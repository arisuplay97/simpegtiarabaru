"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Calendar, Camera, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, X, Loader2, 
  History, Send, ChevronRight, FlipHorizontal, Eye, Trash2,
  UploadCloud, FileText
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  getAbsensiStatusByDate, 
  createKoreksiAbsensi, 
  getKoreksiAbsensiList,
  type SesiAbsensiType,
  type JenisKoreksiType
} from "@/lib/actions/koreksi-absensi"
import { triggerHaptic } from "@/lib/pwa/haptics"
import { compressImageForMobile, formatFileSize } from "@/lib/utils/image-compression"

const SESI_OPTIONS: { id: SesiAbsensiType; label: string; desc: string; time: string }[] = [
  { id: "MASUK",  label: "Presensi Pagi (Masuk)", desc: "Jam Masuk Kerja", time: "07:00 - 08:30" },
  { id: "SIANG",  label: "Presensi Siang",        desc: "Konfirmasi Siang", time: "11:30 - 14:00" },
  { id: "PULANG", label: "Presensi Sore (Pulang)",desc: "Jam Pulang Kerja", time: "16:00 - 18:00" },
]

const JENIS_OPTIONS: { id: JenisKoreksiType; label: string; desc: string; icon: string }[] = [
  { id: "DINAS_LUAR",   label: "Dinas Luar Kantor",      desc: "Menjalankan tugas kedinasan di luar", icon: "🚗" },
  { id: "IZIN_SESI",    label: "Izin Khusus Sesi Ini",   desc: "Izin tidak hadir pada sesi tertentu", icon: "📝" },
  { id: "LAINNYA",      label: "Alasan Lainnya",          desc: "Alasan khusus dengan keterangan lengkap", icon: "📌" },
]

export default function MobileKoreksiAbsensiPage() {
  const { status } = useSession()
  const router = useRouter()

  // Tabs: 'form' | 'riwayat'
  const [activeTab, setActiveTab] = useState<"form" | "riwayat">("form")

  // Form State
  const todayStr = new Date().toISOString().split("T")[0]
  const [tanggal, setTanggal] = useState<string>(todayStr)
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsensiType[]>([])
  const [jenis, setJenis] = useState<JenisKoreksiType>("DINAS_LUAR")
  const [alasan, setAlasan] = useState("")
  
  // Camera & Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const docFileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  // Status & List State
  const [dateAbsensiInfo, setDateAbsensiInfo] = useState<any>(null)
  const [checkingDate, setCheckingDate] = useState(false)
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null)

  // Auth Protection
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // URL Query Param pre-fill (e.g. from Kalender)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tglParam = params.get("tanggal")
      if (tglParam && /^\d{4}-\d{2}-\d{2}$/.test(tglParam)) {
        setTanggal(tglParam)
      }
    }
  }, [])

  // Fetch absensi status for selected date
  useEffect(() => {
    if (status === "authenticated" && tanggal) {
      loadDateStatus(tanggal)
    }
  }, [tanggal, status])

  // Fetch riwayat when tab changes
  useEffect(() => {
    if (status === "authenticated" && activeTab === "riwayat") {
      loadRiwayat()
    }
  }, [activeTab, status])

  // Stop camera and hide mobile bottom bar when camera modal is open
  useEffect(() => {
    if (isCameraOpen) {
      window.dispatchEvent(new CustomEvent("mobile-nav-visibility", { detail: { hide: true } }))
      document.body.style.overflow = "hidden"
    } else {
      window.dispatchEvent(new CustomEvent("mobile-nav-visibility", { detail: { hide: false } }))
      document.body.style.overflow = ""
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
        setCameraStream(null)
      }
    }
    return () => {
      window.dispatchEvent(new CustomEvent("mobile-nav-visibility", { detail: { hide: false } }))
      document.body.style.overflow = ""
    }
  }, [isCameraOpen, cameraStream])

  // Hide mobile bottom bar when full photo preview is open
  useEffect(() => {
    if (viewingPhotoUrl) {
      window.dispatchEvent(new CustomEvent("mobile-nav-visibility", { detail: { hide: true } }))
      document.body.style.overflow = "hidden"
    } else if (!isCameraOpen) {
      window.dispatchEvent(new CustomEvent("mobile-nav-visibility", { detail: { hide: false } }))
      document.body.style.overflow = ""
    }
  }, [viewingPhotoUrl, isCameraOpen])

  const loadDateStatus = async (dateStr: string) => {
    setCheckingDate(true)
    try {
      const res = await getAbsensiStatusByDate(dateStr)
      if (res.data) {
        setDateAbsensiInfo(res.data)
      } else {
        setDateAbsensiInfo(null)
      }
    } catch {
      setDateAbsensiInfo(null)
    } finally {
      setCheckingDate(false)
    }
  }

  const loadRiwayat = async () => {
    setLoadingRiwayat(true)
    try {
      const res = await getKoreksiAbsensiList()
      if (res.data) {
        setRiwayatList(res.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat riwayat koreksi")
    } finally {
      setLoadingRiwayat(false)
    }
  }

  const toggleSesi = (sesi: SesiAbsensiType) => {
    triggerHaptic("light")
    setSelectedSesi(prev => {
      if (prev.includes(sesi)) {
        return prev.filter(s => s !== sesi)
      } else {
        return [...prev, sesi]
      }
    })
  }

  // Camera Handler
  const startCamera = async (facing: "environment" | "user" = cameraFacing) => {
    setIsCameraLoading(true)
    setIsCameraOpen(true)
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: any) {
      console.warn("Direct camera access failed, falling back to camera input:", err)
      setIsCameraOpen(false)
      // Fallback ke input capture kamera native jika getUserMedia tidak diizinkan
      toast.info("Membuka kamera perangkat...")
      fileInputRef.current?.click()
    } finally {
      setIsCameraLoading(false)
    }
  }

  const flipCamera = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment"
    setCameraFacing(nextFacing)
    startCamera(nextFacing)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    triggerHaptic("medium")

    const video = videoRef.current
    const canvas = canvasRef.current

    // Kompres resolusi maksimal 1200px
    const maxDim = 1200
    let w = video.videoWidth || 640
    let h = video.videoHeight || 480
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w)
        w = maxDim
      } else {
        w = Math.round((w * maxDim) / h)
        h = maxDim
      }
    }
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")
    if (ctx) {
      if (cameraFacing === "user") {
        // Mirroring untuk kamera depan
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78)
      setPhotoPreview(dataUrl)
      setSelectedFileName("foto_kamera.jpg")
      setIsCameraOpen(false)
      toast.success("Foto bukti berhasil diambil & dikompres!")
    }
  }

  // Handle native camera & file upload dengan kompresi otomatis di browser
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 15MB")
      return
    }

    if (file.type.startsWith("image/")) {
      const toastId = toast.loading("Mengompresi foto bukti...")
      try {
        const comp = await compressImageForMobile(file, 1280, 1280, 0.8)
        const reader = new FileReader()
        reader.onload = (event) => {
          setPhotoPreview(event.target?.result as string)
          setSelectedFileName(comp.file.name)
          if (comp.savedPercent > 0) {
            toast.success(`Foto terkompresi hemat ${comp.savedPercent}% (${formatFileSize(comp.compressedSize)})`, { id: toastId })
          } else {
            toast.dismiss(toastId)
          }
        }
        reader.readAsDataURL(comp.file)
      } catch {
        toast.dismiss(toastId)
      }
    } else {
      // Dokumen PDF
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string)
        setSelectedFileName(file.name)
        toast.success(`Dokumen "${file.name}" (${formatFileSize(file.size)}) dipilih`)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedSesi.length === 0) {
      toast.error("Pilih minimal satu sesi absensi yang ingin dikoreksi.")
      return
    }

    if (!alasan || alasan.trim().length < 5) {
      toast.error("Mohon isi alasan koreksi absensi secara jelas (minimal 5 karakter).")
      return
    }

    setSubmitting(true)
    triggerHaptic("medium")

    try {
      let uploadedUrl: string | null = null

      // 1. Upload foto bukti ke API jika ada lampiran (tidak wajib)
      if (photoPreview) {
        toast.loading("Mengunggah berkas bukti...", { id: "submit-koreksi" })
        const uploadRes = await fetch("/api/koreksi-absensi/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: photoPreview }),
        })

        const uploadData = await uploadRes.json()
        if (uploadRes.ok && uploadData.url) {
          uploadedUrl = uploadData.url
        }
      }

      // 2. Simpan pengajuan koreksi absensi
      toast.loading("Mengirim pengajuan koreksi...", { id: "submit-koreksi" })
      const res = await createKoreksiAbsensi({
        tanggal,
        sesi: selectedSesi,
        jenis,
        alasan,
        fotoUrl: uploadedUrl,
      })

      if (res.error) {
        toast.error(res.error, { id: "submit-koreksi" })
        return
      }

      toast.success("Pengajuan koreksi absensi berhasil dikirim!", { id: "submit-koreksi" })
      triggerHaptic("success")

      // Reset form
      setSelectedSesi([])
      setAlasan("")
      setPhotoPreview(null)
      setSelectedFileName(null)
      loadDateStatus(tanggal)
      setActiveTab("riwayat")
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses permohonan", { id: "submit-koreksi" })
    } finally {
      setSubmitting(false)
    }
  }

  // Status Badge Helper
  const getStatusBadge = (st: string) => {
    switch (st) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Disetujui</span>
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Ditolak</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Menunggu</span>
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] pb-28 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Header Bar */}
      <div 
        className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            onClick={() => triggerHaptic("light")}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight">Koreksi Absensi</h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Pengajuan Koreksi Per Sesi</p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveTab("form")
            }}
            className={cn(
              "px-3 py-1 rounded-lg transition-all",
              activeTab === "form" 
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            Ajukan
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveTab("riwayat")
            }}
            className={cn(
              "px-3 py-1 rounded-lg transition-all flex items-center gap-1",
              activeTab === "riwayat" 
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            Riwayat
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {activeTab === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Banner Informasi */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Clock className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h2 className="font-bold text-sm">Lupa Atau Ada Kendala Presensi?</h2>
                <p className="text-[11px] text-blue-100 mt-0.5 leading-relaxed">
                  Pilih tanggal & sesi yang diajukan koreksi (bisa lebih dari satu). Lampirkan berkas bukti jika ada.
                </p>
              </div>
            </div>

            {/* 1. Pilih Tanggal */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-2.5 shadow-xs">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  1. Pilih Tanggal Absensi
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">Maks 7 hari lalu</span>
              </label>

              <input
                type="date"
                value={tanggal}
                max={todayStr}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />

              {/* Status Absensi pada Tanggal Ini */}
              {checkingDate ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa catatan presensi...</span>
                </div>
              ) : dateAbsensiInfo ? (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Catatan Presensi Tanggal Terpilih:
                  </p>
                  
                  {dateAbsensiInfo.existingKoreksi && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Perhatian: </span>
                        Sudah ada pengajuan koreksi untuk tanggal ini berstatus{" "}
                        <span className="font-bold underline">{dateAbsensiInfo.existingKoreksi.status}</span>.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className={cn(
                      "p-2 rounded-xl border transition-all",
                      dateAbsensiInfo.absensi?.jamMasuk 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300"
                    )}>
                      <p className="font-bold">Pagi (Masuk)</p>
                      <p className="mt-0.5 font-medium">
                        {dateAbsensiInfo.absensi?.jamMasuk 
                          ? format(new Date(dateAbsensiInfo.absensi.jamMasuk), "HH:mm") 
                          : "Kosong"}
                      </p>
                    </div>

                    <div className={cn(
                      "p-2 rounded-xl border transition-all",
                      dateAbsensiInfo.absensi?.jamSiang 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300"
                    )}>
                      <p className="font-bold">Siang</p>
                      <p className="mt-0.5 font-medium">
                        {dateAbsensiInfo.absensi?.jamSiang 
                          ? format(new Date(dateAbsensiInfo.absensi.jamSiang), "HH:mm") 
                          : "Kosong"}
                      </p>
                    </div>

                    <div className={cn(
                      "p-2 rounded-xl border transition-all",
                      dateAbsensiInfo.absensi?.jamKeluar 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300"
                    )}>
                      <p className="font-bold">Sore (Pulang)</p>
                      <p className="mt-0.5 font-medium">
                        {dateAbsensiInfo.absensi?.jamKeluar 
                          ? format(new Date(dateAbsensiInfo.absensi.jamKeluar), "HH:mm") 
                          : "Kosong"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* 2. Pilih Sesi yang Dikoreksi (Multi-Select) */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. Sesi Yang Ingin Dikoreksi
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  Bisa pilih &gt; 1 sesi
                </span>
              </div>

              <div className="space-y-2">
                {SESI_OPTIONS.map((opt) => {
                  const isChecked = selectedSesi.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleSesi(opt.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all",
                        isChecked 
                          ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500 shadow-xs" 
                          : "bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                      )}
                    >
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", isChecked ? "text-blue-700 dark:text-blue-300" : "text-zinc-800 dark:text-zinc-200")}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {opt.desc} • <span className="font-mono text-[10px]">{opt.time}</span>
                        </p>
                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                        isChecked 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                      )}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Pilih Jenis Alasan Koreksi */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span> Jenis Permohonan
              </label>

              <div className="grid grid-cols-1 gap-2">
                {JENIS_OPTIONS.map((item) => {
                  const isSelected = jenis === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light")
                        setJenis(item.id)
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all",
                        isSelected 
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs" 
                          : "bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-tight">{item.label}</p>
                        <p className={cn("text-[10px] mt-0.5 truncate", isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400")}>
                          {item.desc}
                        </p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                        isSelected ? "border-white dark:border-zinc-900 bg-white/20 dark:bg-zinc-900/20" : "border-zinc-300 dark:border-zinc-600"
                      )}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Keterangan / Alasan */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-2.5 shadow-xs">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span> Keterangan Alasan
              </label>

              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tuliskan keterangan detail mengapa belum absen atau alasan izin pada sesi ini..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                required
              />
            </div>

            {/* 5. Lampiran Bukti (Opsional) */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  5. Lampiran Bukti (Opsional)
                </label>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-700/60">
                  Opsional
                </span>
              </div>

              {photoPreview ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-950 aspect-video flex items-center justify-center group shadow-inner">
                    {photoPreview.startsWith("data:application/pdf") ? (
                      <div className="flex flex-col items-center justify-center text-white p-4">
                        <FileText className="w-12 h-12 text-blue-400 mb-1.5" />
                        <p className="text-xs font-bold text-center truncate max-w-[220px]">{selectedFileName || "Dokumen PDF"}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Berkas Dokumen PDF</p>
                      </div>
                    ) : (
                      <img 
                        src={photoPreview} 
                        alt="Bukti Foto" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setViewingPhotoUrl(photoPreview)}
                        className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Ganti Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null)
                        setSelectedFileName(null)
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Tombol Kamera */}
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex flex-col items-center justify-center gap-2 transition-all active:scale-98 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Foto Kamera</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Ambil langsung</p>
                      </div>
                    </button>

                    {/* Tombol Upload File */}
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex flex-col items-center justify-center gap-2 transition-all active:scale-98 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pilih Berkas</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Galeri / PDF</p>
                      </div>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 text-center">
                    Tidak wajib melampirkan foto jika tidak ada berkas pendukung.
                  </p>

                  {/* Hidden Input Files */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                </div>
              )}
            </div>

            {/* Tombol Kirim Permohonan */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (dateAbsensiInfo?.existingKoreksi?.status === "PENDING")}
                className="w-full py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Permohonan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Permohonan Koreksi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* RIWAYAT PENGAJUAN TAB */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Daftar Koreksi Saya
              </p>
              <button
                onClick={loadRiwayat}
                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold hover:underline"
              >
                <RefreshCw className={cn("w-3 h-3", loadingRiwayat && "animate-spin")} />
                Muat Ulang
              </button>
            </div>

            {loadingRiwayat ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/50 dark:border-zinc-800/50" />
              ))
            ) : riwayatList.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 p-6">
                <History className="mx-auto h-10 w-10 mb-2 opacity-30 stroke-[1.5]" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Belum Ada Pengajuan</p>
                <p className="text-xs text-zinc-400 mt-1">Anda belum pernah mengajukan koreksi absensi.</p>
              </div>
            ) : (
              riwayatList.map((item) => {
                const sesiList: string[] = Array.isArray(item.sesi) ? item.sesi : [item.sesi]
                const sesiLabels = sesiList.map(s => s === "MASUK" ? "Pagi" : s === "SIANG" ? "Siang" : "Pulang").join(", ")
                const dateStr = format(new Date(item.tanggal), "dd MMMM yyyy", { locale: idLocale })

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {dateStr}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                          Sesi: {sesiLabels}
                        </p>
                      </div>

                      {item.fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingPhotoUrl(item.fotoUrl)}
                          className="shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 relative group"
                        >
                          <img src={item.fotoUrl} alt="Bukti" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </div>

                    <div className="text-xs bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.jenis.replace(/_/g, " ")}:
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 text-[11px] leading-relaxed">
                        {item.alasan}
                      </p>
                    </div>

                    {item.catatanApprover && (
                      <div className="text-[11px] p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Catatan HRD: </span>
                        {item.catatanApprover}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span>Diajukan: {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span>
                      {item.approvedAt && (
                        <span>Diproses: {format(new Date(item.approvedAt), "dd MMM yyyy", { locale: idLocale })}</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL FULLSCREEN KAMERA LANGSUNG */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between animate-in fade-in-50">
          {/* Top Bar Camera */}
          <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <button
              type="button"
              onClick={() => setIsCameraOpen(false)}
              className="p-2 rounded-full bg-white/20 text-white backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-white tracking-wider uppercase">
              Foto Bukti Langsung
            </span>

            <button
              type="button"
              onClick={flipCamera}
              className="p-2 rounded-full bg-white/20 text-white backdrop-blur-md"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Video */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {isCameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white bg-black z-20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs">Mengaktifkan kamera...</span>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                cameraFacing === "user" && "scale-x-[-1]"
              )}
            />
            {/* Viewfinder guide frame */}
            <div className="absolute inset-8 border-2 border-white/40 rounded-3xl pointer-events-none" />
          </div>

          {/* Bottom Bar Shutter */}
          <div className="p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center z-10 pb-12">
            <button
              type="button"
              onClick={capturePhoto}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform shadow-xl"
            >
              <div className="w-14 h-14 rounded-full bg-white active:bg-zinc-200 transition-colors" />
            </button>
          </div>

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* MODAL PREVIEW FOTO FULLSCREEN */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in-50">
          <div className="w-full max-w-md flex justify-end pb-3">
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full max-w-md rounded-2xl overflow-hidden bg-black max-h-[80vh] flex items-center justify-center shadow-2xl">
            <img src={viewingPhotoUrl} alt="Preview Foto" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
