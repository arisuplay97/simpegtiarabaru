"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, X, CheckCircle, AlertTriangle, Camera } from "lucide-react"
import { saveFaceDescriptor } from "@/lib/actions/face"
import { toast } from "sonner"

type FaceGuide =
  | "loading"
  | "no_face"
  | "multiple_faces"
  | "too_close"
  | "too_far"
  | "look_center"
  | "steady"
  | "capturing"
  | "done"

const GUIDE_MESSAGES: Record<FaceGuide, { text: string; color: string }> = {
  loading: { text: "Memuat sistem pengenalan wajah...", color: "text-white/70" },
  no_face: { text: "Wajah tidak terdeteksi. Hadapkan wajah ke kamera.", color: "text-red-400" },
  multiple_faces: { text: "Terdeteksi lebih dari 1 wajah! Pastikan hanya Anda di depan kamera.", color: "text-orange-400" },
  too_close: { text: "Wajah terlalu dekat. Mundur sedikit.", color: "text-amber-400" },
  too_far: { text: "Wajah terlalu jauh. Mendekat sedikit.", color: "text-amber-400" },
  look_center: { text: "Posisikan wajah ke tengah lingkaran...", color: "text-blue-400" },
  steady: { text: "Bagus! Tetap diam... mengambil gambar", color: "text-emerald-400" },
  capturing: { text: "Memproses wajah Anda...", color: "text-emerald-400" },
  done: { text: "Wajah berhasil didaftarkan!", color: "text-emerald-400" },
}

export default function FaceRegisterPage() {
  const { status } = useSession()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const steadyCountRef = useRef(0)

  const [guide, setGuide] = useState<FaceGuide>("loading")
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") init()
    return () => cleanup()
  }, [status])

  const cleanup = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const init = async () => {
    try {
      // Load face-api.js dynamically
      const faceapi = await import("@vladmandic/face-api")
      const MODEL_URL = "/models"

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      setModelsLoaded(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play()
          startDetection(faceapi)
        }
      }
    } catch (e: any) {
      toast.error("Gagal memuat sistem kamera: " + e.message)
    }
  }

  const startDetection = (faceapi: any) => {
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return
      if (guide === "capturing" || guide === "done") return

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
      const detections = await faceapi.detectAllFaces(videoRef.current, options)
        .withFaceLandmarks()

      // Draw overlay
      const overlay = overlayCanvasRef.current
      if (overlay && videoRef.current) {
        overlay.width = videoRef.current.videoWidth
        overlay.height = videoRef.current.videoHeight
        const ctx = overlay.getContext("2d")
        ctx?.clearRect(0, 0, overlay.width, overlay.height)
      }

      if (detections.length === 0) {
        setGuide("no_face")
        steadyCountRef.current = 0
        return
      }

      if (detections.length > 1) {
        setGuide("multiple_faces")
        steadyCountRef.current = 0
        return
      }

      const det = detections[0]
      const box = det.detection.box
      const videoW = videoRef.current!.videoWidth
      const videoH = videoRef.current!.videoHeight

      // Cek ukuran wajah (terlalu dekat / jauh)
      const faceRatio = box.width / videoW
      if (faceRatio > 0.65) {
        setGuide("too_close")
        steadyCountRef.current = 0
        return
      }
      if (faceRatio < 0.2) {
        setGuide("too_far")
        steadyCountRef.current = 0
        return
      }

      // Cek posisi wajah di tengah
      const faceCX = box.x + box.width / 2
      const faceCY = box.y + box.height / 2
      const centerX = videoW / 2
      const centerY = videoH / 2
      const offsetX = Math.abs(faceCX - centerX) / videoW
      const offsetY = Math.abs(faceCY - centerY) / videoH

      if (offsetX > 0.2 || offsetY > 0.25) {
        setGuide("look_center")
        steadyCountRef.current = 0
        return
      }

      // Wajah bagus → hitung steady frames
      steadyCountRef.current += 1
      if (steadyCountRef.current < 12) {
        setGuide("steady")
        return
      }

      // CAPTURE!
      clearInterval(interval)
      setGuide("capturing")
      await captureAndSave(faceapi)
    }, 150)

    detectionIntervalRef.current = interval
  }

  const captureAndSave = useCallback(async (faceapi: any) => {
    setSaving(true)
    try {
      const video = videoRef.current!
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0)

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
      const result = await faceapi.detectSingleFace(canvas, options)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!result) {
        toast.error("Wajah tidak berhasil diproses. Silakan coba lagi.")
        setGuide("no_face")
        steadyCountRef.current = 0
        setSaving(false)
        startDetection(faceapi)
        return
      }

      // Descriptor: Float32Array (128 angka)
      const descriptor = Array.from(result.descriptor) as number[]

      const res = await saveFaceDescriptor(descriptor)
      if (res.error) throw new Error(res.error)

      cleanup()
      setDone(true)
      setGuide("done")
      toast.success("Wajah berhasil didaftarkan! Sistem siap digunakan.")
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan data wajah.")
      setGuide("no_face")
      steadyCountRef.current = 0
    } finally {
      setSaving(false)
    }
  }, [])

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-900 to-neutral-900 p-6">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center border border-white/20">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 ring-4 ring-emerald-500/30">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2">Wajah Terdaftar!</h2>
          <p className="text-sm text-white/70 text-center mb-8">
            Data biometrik wajah Anda telah berhasil disimpan. Mulai sekarang, absensi menggunakan verifikasi wajah otomatis.
          </p>
          <button
            onClick={() => router.push("/m/dashboard")}
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 text-base transition-all"
          >
            Mulai Absensi
          </button>
        </div>
      </div>
    )
  }

  const guideInfo = GUIDE_MESSAGES[guide]

  return (
    <div className="flex min-h-screen flex-col bg-black relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <button onClick={() => { cleanup(); router.push("/m/dashboard") }}
          className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
          <p className="text-white font-bold text-sm">Daftarkan Wajah</p>
          <p className="text-white/60 text-[10px]">Diperlukan untuk absensi</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="relative flex-1 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Face oval guide */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          {/* Oval outline */}
          <div className={`w-56 h-72 rounded-full border-4 transition-all duration-300 ${
            guide === "steady" || guide === "capturing"
              ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]"
              : guide === "no_face" || guide === "multiple_faces"
              ? "border-red-400"
              : guide === "too_close" || guide === "too_far"
              ? "border-amber-400"
              : "border-white/40"
          }`} />

          {/* Overlay gelap di luar oval */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 56vw 72vw at 50% 50%, transparent 43%, rgba(0,0,0,0.7) 45%)"
            }}
          />
        </div>
      </div>

      {/* Panduan bawah */}
      <div className="relative z-20 bg-gradient-to-t from-black/90 to-transparent px-6 pb-12 pt-8 flex flex-col items-center gap-4">
        {/* Guide text */}
        <div className={`flex items-center gap-2 font-semibold text-sm text-center max-w-xs transition-all ${guideInfo.color}`}>
          {guide === "loading" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {guide === "capturing" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {(guide === "no_face" || guide === "multiple_faces" || guide === "too_close" || guide === "too_far") &&
            <AlertTriangle className="h-4 w-4 shrink-0" />}
          {(guide === "look_center" || guide === "steady") && <Camera className="h-4 w-4 shrink-0" />}
          <span>{guideInfo.text}</span>
        </div>

        {/* Steady indicator */}
        {guide === "steady" && (
          <div className="flex gap-2">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  steadyCountRef.current >= i ? "bg-emerald-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-2 flex flex-col gap-1.5 w-full max-w-xs">
          {[
            "Pastikan pencahayaan cukup terang",
            "Hadapkan wajah langsung ke kamera",
            "Lepas kacamata jika perlu",
            "Proses otomatis, tidak perlu menekan tombol",
          ].map(tip => (
            <p key={tip} className="text-white/40 text-[11px] flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">•</span>{tip}
            </p>
          ))}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
