"use client"
import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Camera, CheckCircle, Loader2, MapPin, X, Clock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id } from "date-fns/locale"

function WatermarkClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-2xl px-6 py-3 flex flex-col items-center border border-white/10">
      <div className="text-3xl font-black text-white tracking-widest drop-shadow-md flex items-center gap-2">
        <Clock className="w-6 h-6 text-emerald-400" />
        {format(time, "HH:mm:ss")}
      </div>
      <div className="text-xs font-semibold text-white/80 mt-1 uppercase tracking-widest">
        {format(time, "dd MMM yyyy", { locale: id })}
      </div>
    </div>
  )
}

export default function MobileSelfie() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultData, setResultData] = useState<{ status: string; tipe: string } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      startCamera()
      getLocation()
    }
    return () => { setStream(null) }
  }, [status])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      toast.error("Tidak bisa akses kamera. Izinkan di browser.")
    }
  }

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => toast.error("Pastikan GPS / Lokasi menyala di HP Anda.")
    )
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    
    // Draw mirrored since front camera is mirrored
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    setCaptured(dataUrl)
    stream?.getTracks().forEach(t => t.stop())
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  const submit = async () => {
    if (!captured) return
    if (!location) {
      toast.error("Menunggu sinyal GPS lokasi... Pastikan GPS menyala.", { duration: 4000 })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(captured)
      const blob = await res.blob()
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("foto", file)
      formData.append("latitude", String(location.lat))
      formData.append("longitude", String(location.lng))

      const response = await fetch("/api/absensi/selfie", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Gagal absensi")
      
      setResultData({ status: data.status || "HADIR", tipe: data.tipe || "CHECK_IN" })
      setDone(true)
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (done) {
    const isCheckIn = resultData?.tipe === "CHECK_IN"
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-[#18553f] to-neutral-900 border-none">
        <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
            <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-black text-neutral-800 dark:text-white text-center mb-2">
            {isCheckIn ? "Check-In Berhasil" : "Check-Out Berhasil"}
          </h2>
          <p className="text-sm font-medium text-neutral-500 text-center mb-6">
            Pukul <strong className="text-neutral-800 dark:text-white text-lg">{format(new Date(), "HH:mm")}</strong> WIB
          </p>

          <div className="w-full space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Status Presensi</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{resultData?.status}</span>
            </div>
            {location && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Akurasi GPS</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-300">± {Math.round(location.accuracy)} m</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/m/dashboard")}
            className="w-full mt-8 rounded-full bg-[#18553f] hover:bg-[#113f2f] text-white py-4 font-bold text-lg active:scale-95 transition-all shadow-lg"
          >
            Selesai
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black relative">
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start">
        <button onClick={() => router.push("/m/dashboard")} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white">
          <X className="h-6 w-6" />
        </button>
      </div>

      <WatermarkClock />

      <div className="flex-1 relative overflow-hidden">
        {!captured ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        ) : (
          <div className="w-full h-full relative">
            <img src={captured} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="Selfie Result" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-96 border-4 border-white/30 rounded-[3rem] pointer-events-none" />
      </div>

      <div className="bg-black pb-safe px-6 pt-6 pb-12 flex flex-col items-center">
        {!location ? (
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full mb-6 font-medium text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Menunggu Lokasi GPS...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full mb-6 font-medium text-sm">
            <MapPin className="h-4 w-4" />
            Lokasi Akurat (±{Math.round(location.accuracy)}m)
          </div>
        )}

        {!captured ? (
          <button
            onClick={capture}
            className="group relative flex h-20 w-20 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full border-4 border-white/50 transition-all group-active:scale-95" />
            <div className="h-16 w-16 rounded-full bg-white transition-all group-active:scale-90" />
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={retake}
              disabled={isSubmitting}
              className="py-4 rounded-full bg-white/10 text-white font-bold tracking-wide active:scale-95 transition-transform"
            >
              Ulangi
            </button>
            <button
              onClick={submit}
              disabled={isSubmitting || !location}
              className="py-4 rounded-full bg-emerald-600 text-white font-bold tracking-wide flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kirim Presensi"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
