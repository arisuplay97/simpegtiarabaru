"use client"
import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Camera, CheckCircle, Loader2, MapPin, X } from "lucide-react"
import { toast } from "sonner"

export default function MobileSelfie() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [statusAbsen, setStatusAbsen] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      startCamera()
      getLocation()
    }
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [status])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      toast.error("Tidak bisa akses kamera. Izinkan akses kamera di browser.")
    }
  }

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error("Tidak bisa akses lokasi")
    )
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
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
    setIsSubmitting(true)
    try {
      // Convert dataURL to blob
      const res = await fetch(captured)
      const blob = await res.blob()
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("foto", file)
      formData.append("pegawaiId", (session?.user as any)?.pegawaiId || "")
      if (location) {
        formData.append("latitude", String(location.lat))
        formData.append("longitude", String(location.lng))
      }

      const response = await fetch("/api/absensi/selfie", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Gagal absensi")
      
      setStatusAbsen(data.status || "HADIR")
      setDone(true)
      toast.success("Absensi berhasil!")
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan absensi")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 bg-background">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Absensi Berhasil!</h2>
          <p className="mt-2 text-muted-foreground">Status: <strong>{statusAbsen}</strong></p>
          {location && (
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/m/dashboard")}
          className="rounded-2xl bg-primary px-8 py-3 font-semibold text-white"
        >
          Kembali ke Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Camera */}
      <div className="relative flex-1">
        {!captured ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        ) : (
          <img src={captured} alt="selfie" className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
        )}

        {/* Overlay: close */}
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Location badge */}
        {location && (
          <div className="absolute top-12 right-4 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-white">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">GPS OK</span>
          </div>
        )}

        {/* Face guide */}
        {!captured && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full border-4 border-white/40" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-8 bg-black px-6 py-8">
        {!captured ? (
          <button
            onClick={capture}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl"
          >
            <Camera className="h-9 w-9 text-black" />
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/40 text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-xl disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              ) : (
                <CheckCircle className="h-9 w-9 text-white" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
