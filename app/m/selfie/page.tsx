"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Camera, CheckCircle, Loader2, MapPin, X, Clock, AlertTriangle, WifiOff, ShieldCheck, ShieldX } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getMyFaceStatus } from "@/lib/actions/face"
import { queueAbsensi, syncOfflineQueue } from "@/lib/offline/absensi-queue"

const MAX_FACE_FAIL = 6
const FACE_CHECK_INTERVAL = 200 // ms

function WatermarkClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-md rounded-2xl px-5 py-2.5 flex flex-col items-center border border-white/10 pointer-events-none">
      <div className="text-2xl font-black text-white tracking-widest flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-400" />
        {format(time, "HH:mm:ss")}
      </div>
      <div className="text-[11px] text-white/70 mt-0.5">
        {format(time, "EEEE, dd MMM yyyy", { locale: id })}
      </div>
    </div>
  )
}

export default function MobileSelfie() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const faceApiRef = useRef<any>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const steadyFramesRef = useRef(0)
  const faceAttemptsRef = useRef(0)

  const [pegawaiFaceStatus, setPegawaiFaceStatus] = useState<{
    id: string, faceRegistered: boolean, faceDescriptor: number[], faceFailCount: number
  } | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [faceGuide, setFaceGuide] = useState<"loading" | "no_face" | "ok" | "too_close" | "too_far" | "multiple" | "steady" | "verified" | "fail">("loading")
  const [faceVerified, setFaceVerified] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultData, setResultData] = useState<{ status: string; tipe: string; pendingApproval?: boolean } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") init()
    return () => cleanup()
  }, [status])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineQueue()
        .then(({ synced }) => { if (synced > 0) toast.success(`${synced} absensi offline berhasil disinkronkan!`) })
        .catch(() => {})
    }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const cleanup = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const init = async () => {
    // 1. Load face status
    const faceStatus = await getMyFaceStatus()
    if (!faceStatus?.faceRegistered) {
      toast.error("Wajah belum terdaftar! Daftarkan wajah Anda terlebih dahulu.")
      router.push("/m/face-register")
      return
    }
    setPegawaiFaceStatus(faceStatus as any)

    // 2. Start GPS
    getLocation()

    // 3. Load face-api models
    try {
      const faceapi = await import("@vladmandic/face-api")
      const MODEL_URL = "/models"
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      faceApiRef.current = faceapi
      setModelsLoaded(true)
      setFaceGuide("no_face")
    } catch {
      toast.error("Gagal memuat model AI. Coba refresh halaman.")
      return
    }

    // 4. Start camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play()
          const fa = faceApiRef.current
          if (fa) startFaceDetection(fa, faceStatus as any)
        }
      }
    } catch {
      toast.error("Tidak bisa akses kamera. Izinkan di browser.")
    }
  }

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => toast.error("Aktifkan GPS / Lokasi di HP Anda."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
    // Multi-sample: ambil ulang setelah 3 detik untuk konsistensi
    setTimeout(() => {
      navigator.geolocation?.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }, 3000)
  }

  const startFaceDetection = (faceapi: any, faceStatus: typeof pegawaiFaceStatus) => {
    const registeredDescriptor = faceStatus?.faceDescriptor

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return
      if (captured || faceVerified) return

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
      const dets = await faceapi.detectAllFaces(videoRef.current, opts).withFaceLandmarks()

      if (dets.length === 0) { setFaceGuide("no_face"); steadyFramesRef.current = 0; return }
      if (dets.length > 1) { setFaceGuide("multiple"); steadyFramesRef.current = 0; return }

      const box = dets[0].detection.box
      const vW = videoRef.current!.videoWidth
      const ratio = box.width / vW

      if (ratio > 0.65) { setFaceGuide("too_close"); steadyFramesRef.current = 0; return }
      if (ratio < 0.18) { setFaceGuide("too_far"); steadyFramesRef.current = 0; return }

      const faceCX = box.x + box.width / 2
      const faceCY = box.y + box.height / 2
      const vH = videoRef.current!.videoHeight
      const offsetX = Math.abs(faceCX - vW / 2) / vW
      const offsetY = Math.abs(faceCY - vH / 2) / vH
      if (offsetX > 0.2 || offsetY > 0.25) { setFaceGuide("no_face"); steadyFramesRef.current = 0; return }

      // Steady
      steadyFramesRef.current += 1
      setFaceGuide("steady")

      if (steadyFramesRef.current >= 15) {
        // CAPTURE & VERIFY
        clearInterval(detectionIntervalRef.current!)
        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current!.videoWidth
        canvas.height = videoRef.current!.videoHeight
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(videoRef.current!, 0, 0)

        const fullResult = await faceapi.detectSingleFace(canvas, opts)
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (!fullResult) {
          faceAttemptsRef.current += 1
          steadyFramesRef.current = 0
          setFaceGuide("no_face")
          startFaceDetection(faceapi, faceStatus)
          return
        }

        // Bandingkan descriptor
        if (registeredDescriptor && registeredDescriptor.length === 128) {
          const registered = new Float32Array(registeredDescriptor)
          const distance = faceapi.euclideanDistance(fullResult.descriptor, registered)

          if (distance < 0.55) {
            // WAJAH COCOK!
            setFaceVerified(true)
            setFaceGuide("verified")
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
            setCaptured(dataUrl)
            streamRef.current?.getTracks().forEach(t => t.stop())
          } else {
            // Wajah tidak cocok
            faceAttemptsRef.current += 1
            steadyFramesRef.current = 0
            setFaceGuide("fail")
            setTimeout(() => {
              setFaceGuide("no_face")
              startFaceDetection(faceapi, faceStatus)
            }, 2000)
          }
        }
      }
    }, FACE_CHECK_INTERVAL)
  }

  const handleForceCapture = useCallback(async () => {
    // Soft-block: sudah gagal >= MAX_FACE_FAIL, paksa foto manual
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    setCaptured(dataUrl)
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(detectionIntervalRef.current!)
    toast.warning("Foto diambil. Absensi akan berstatus PENDING dan menunggu persetujuan HRD.")
  }, [])

  const submit = useCallback(async () => {
    if (!captured) return

    const isGPSRequired = !faceVerified  // Jika face fail, GPS tetap wajib

    if (!location && !isOnline) {
      // Jika offline sekalipun, tetap bisa simpan ke queue lokal
    } else if (!location) {
      toast.error("Menunggu lokasi GPS... Pastikan GPS aktif.", { duration: 4000 })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(captured)
      const blob = await res.blob()
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" })

      const fd = new FormData()
      fd.append("foto", file)
      fd.append("latitude", String(location?.lat || 0))
      fd.append("longitude", String(location?.lng || 0))
      fd.append("accuracy", String(location?.accuracy || 999))
      fd.append("faceVerified", String(faceVerified))
      fd.append("faceAttempts", String(faceAttemptsRef.current))

      if (!isOnline) {
        // OFFLINE MODE → simpan ke IndexedDB
        await queueAbsensi({
          foto: captured,
          latitude: location?.lat || 0,
          longitude: location?.lng || 0,
          accuracy: location?.accuracy || 999,
          faceVerified,
          faceAttempts: faceAttemptsRef.current,
        })
        toast.success("Absensi disimpan offline. Akan dikirim otomatis saat sinyal kembali.")
        setResultData({ status: "OFFLINE", tipe: "CHECK_IN" })
        setDone(true)
        return
      }

      const response = await fetch("/api/absensi/selfie", { method: "POST", body: fd })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Gagal absensi")

      setResultData({ status: data.status || "HADIR", tipe: data.tipe || "CHECK_IN", pendingApproval: data.pendingApproval })
      setDone(true)
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.")
    } finally {
      setIsSubmitting(false)
    }
  }, [captured, location, isOnline, faceVerified])

  // ─── DONE SCREEN ───
  if (done) {
    const isCheckIn = resultData?.tipe === "CHECK_IN" || resultData?.status === "OFFLINE"
    const isPending = resultData?.pendingApproval
    const isOffline = resultData?.status === "OFFLINE"

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-[#18553f] to-neutral-900">
        <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isPending ? "bg-amber-500" : isOffline ? "bg-blue-500" : "bg-emerald-500"}`} />
          <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 ring-8 ${isPending ? "bg-amber-100 ring-amber-50" : isOffline ? "bg-blue-100 ring-blue-50" : "bg-emerald-100 ring-emerald-50"}`}>
            {isPending ? <AlertTriangle className="h-10 w-10 text-amber-600" />
              : isOffline ? <WifiOff className="h-10 w-10 text-blue-600" />
              : <CheckCircle className="h-10 w-10 text-emerald-600" />}
          </div>
          <h2 className="text-2xl font-black text-neutral-800 dark:text-white text-center mb-2">
            {isPending ? "Menunggu Persetujuan" : isOffline ? "Tersimpan Offline" : isCheckIn ? "Check-In Berhasil" : "Check-Out Berhasil"}
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-6">
            {isPending ? "Verifikasi wajah gagal. HRD akan meninjau absensi Anda."
              : isOffline ? "Absensi tersimpan di perangkat. Akan dikirim otomatis saat online."
              : `Pukul ${format(new Date(), "HH:mm")} WITA`}
          </p>
          <div className="w-full space-y-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Status Wajah</span>
              <span className={`font-bold flex items-center gap-1 ${faceVerified ? "text-emerald-600" : "text-red-500"}`}>
                {faceVerified ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                {faceVerified ? "Terverifikasi" : "Tidak Cocok"}
              </span>
            </div>
            {location && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Akurasi GPS</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-300">±{Math.round(location.accuracy)}m</span>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push("/m/dashboard")}
            className="w-full rounded-full bg-[#18553f] hover:bg-[#113f2f] text-white py-4 font-bold text-lg"
          >
            Selesai
          </button>
        </div>
      </div>
    )
  }

  // ─── GUIDE MESSAGES ───
  const guideConfig: Record<string, { text: string; color: string; icon?: any }> = {
    loading: { text: "Memuat kamera & AI...", color: "text-white/60" },
    no_face: { text: "Wajah tidak terdeteksi. Hadapkan wajah ke kamera.", color: "text-amber-400", icon: AlertTriangle },
    too_close: { text: "Terlalu dekat! Mundur sedikit.", color: "text-amber-400", icon: AlertTriangle },
    too_far: { text: "Terlalu jauh! Mendekatlah ke kamera.", color: "text-amber-400", icon: AlertTriangle },
    multiple: { text: "Terdeteksi > 1 wajah! Hanya Anda sendiri.", color: "text-red-400", icon: AlertTriangle },
    steady: { text: "Wajah terdeteksi... steady...", color: "text-emerald-400" },
    verified: { text: "✓ Wajah terverifikasi!", color: "text-emerald-400" },
    fail: { text: "Wajah tidak cocok! Coba lagi...", color: "text-red-400", icon: ShieldX },
  }
  const guide = guideConfig[faceGuide] || guideConfig.loading

  const faceFailCount = pegawaiFaceStatus?.faceFailCount || 0
  const canForceCapture = faceFailCount >= MAX_FACE_FAIL - 1

  return (
    <div className="flex flex-col bg-black" style={{ height: "100dvh" }}>
      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <button onClick={() => { cleanup(); router.push("/m/dashboard") }}
          className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white">
          <X className="h-5 w-5" />
        </button>
        {!isOnline && (
          <div className="flex items-center gap-1.5 bg-amber-500/90 text-black text-xs font-bold px-3 py-1.5 rounded-full">
            <WifiOff className="h-3.5 w-3.5" /> Mode Offline
          </div>
        )}
      </div>

      <WatermarkClock />

      {/* Camera full height */}
      <div className="relative flex-1 overflow-hidden">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Oval face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-56 h-72 rounded-full border-4 transition-colors duration-300 ${
                  faceGuide === "verified" || faceGuide === "steady" ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]"
                  : faceGuide === "fail" || faceGuide === "multiple" ? "border-red-400"
                  : faceGuide === "too_close" || faceGuide === "too_far" ? "border-amber-400"
                  : "border-white/30"
                }`}
              />
              {/* Dark vignette outside oval */}
              <div className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse 57vw 73vw at 50% 50%, transparent 42%, rgba(0,0,0,0.65) 44%)" }}
              />
            </div>

            {/* Shield icon overlay saat verified */}
            {faceGuide === "verified" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <ShieldCheck className="h-16 w-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0">
            <img src={captured} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/50 rounded-2xl px-6 py-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-300 font-bold text-sm">Wajah Terverifikasi</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="relative z-10 bg-black/80 backdrop-blur-sm px-6 pt-4 pb-8 flex flex-col items-center gap-3"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>

        {/* Face guide message */}
        {!captured && (
          <div className={`flex items-center gap-2 text-sm font-semibold text-center ${guide.color}`}>
            {guide.icon && <guide.icon className="h-4 w-4 shrink-0" />}
            <span>{guide.text}</span>
          </div>
        )}

        {/* GPS status */}
        {!location ? (
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-full text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Menunggu GPS...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full text-sm">
            <MapPin className="h-3.5 w-3.5" /> Lokasi: ±{Math.round(location.accuracy)}m
          </div>
        )}

        {/* Tombol aksi */}
        {!captured ? (
          canForceCapture && (
            <button
              onClick={handleForceCapture}
              className="mt-2 w-full py-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold text-sm"
            >
              Ambil Foto Manual (Pending HRD)
            </button>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <button
              onClick={() => { setCaptured(null); setFaceVerified(false); setFaceGuide("no_face"); steadyFramesRef.current = 0; init() }}
              disabled={isSubmitting}
              className="py-4 rounded-2xl bg-white/10 text-white font-bold text-sm"
            >
              Ulangi
            </button>
            <button
              onClick={submit}
              disabled={isSubmitting || (!isOnline && !location)}
              className="py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isOnline ? "Kirim Presensi" : "Simpan Offline"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
