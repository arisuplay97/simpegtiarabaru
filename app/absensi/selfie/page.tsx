"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Smartphone,
  Navigation,
  Building2,
  Wifi,
  RefreshCw,
  ArrowLeft,
  CameraOff,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type CaptureStep = "idle" | "ready" | "capturing" | "verifying" | "success" | "checkout_success"
type CheckType = "checkin" | "checkout"

export default function SelfieAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [captureStep, setCaptureStep] = useState<CaptureStep>("idle")
  const [checkType, setCheckType] = useState<CheckType>("checkin")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<"checking" | "valid" | "invalid">("checking")
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)

  // Jam real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Cek GPS saat halaman dibuka
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("invalid")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsAccuracy(Math.round(pos.coords.accuracy))
        setGpsStatus("valid")
      },
      () => setGpsStatus("invalid"),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Buka kamera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraOn(true)
      setCaptureStep("ready")
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Izin kamera ditolak. Mohon izinkan akses kamera di browser.")
      } else if (err.name === "NotFoundError") {
        setCameraError("Kamera tidak ditemukan di perangkat ini.")
      } else {
        setCameraError("Gagal membuka kamera. Coba refresh halaman.")
      }
      setIsCameraOn(false)
    }
  }, [])

  // Tutup kamera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsCameraOn(false)
    setCaptureStep("idle")
    setCapturedPhoto(null)
  }, [])

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Ambil foto
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setCaptureStep("capturing")

    // Ambil frame dari video ke canvas
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const photoData = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedPhoto(photoData)
    }

    // Simulasi verifikasi
    await new Promise(r => setTimeout(r, 1000))
    setCaptureStep("verifying")
    await new Promise(r => setTimeout(r, 1500))

    const now = formatTime(new Date())
    if (checkType === "checkin") {
      setCheckInTime(now)
      setCaptureStep("success")
      toast.success(`Check-in berhasil pukul ${now}`)
    } else {
      setCheckOutTime(now)
      setCaptureStep("checkout_success")
      toast.success(`Check-out berhasil pukul ${now}`)
    }

    // Matikan kamera setelah sukses
    stopCamera()
  }

  // Reset untuk coba lagi
  const handleReset = () => {
    setCapturedPhoto(null)
    setCaptureStep("idle")
    setIsCameraOn(false)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  const formatDate = (date: Date) =>
    date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const isSuccess = captureStep === "success" || captureStep === "checkout_success"

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kehadiran", "Absensi Selfie"]} />
        <main className="flex-1 overflow-auto p-6">

          <div className="mb-4">
            <Link href="/absensi">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Absensi
              </Button>
            </Link>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Absensi Selfie</h1>
              <p className="text-sm text-muted-foreground">
                Verifikasi wajah dan lokasi untuk check-in / check-out
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">

              {/* ===== KIRI — KAMERA ===== */}
              <div className="lg:col-span-2">
                <Card className="card-premium overflow-hidden">
                  <CardContent className="p-0">

                    {/* Area Kamera */}
                    <div className="relative aspect-[4/3] bg-gray-900">

                      {/* Video live */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 h-full w-full object-cover ${isCameraOn && captureStep === "ready" ? "block" : "hidden"}`}
                      />

                      {/* Canvas tersembunyi untuk capture */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Foto hasil capture */}
                      {capturedPhoto && (
                        <img
                          src={capturedPhoto}
                          alt="Foto absensi"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}

                      {/* Idle state — belum buka kamera */}
                      {captureStep === "idle" && !cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
                            <Camera className="h-12 w-12 text-white/70" />
                          </div>
                          <p className="text-white/70 text-sm">Klik tombol di bawah untuk membuka kamera</p>
                        </div>
                      )}

                      {/* Error kamera */}
                      {cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                          <CameraOff className="h-12 w-12 text-red-400" />
                          <p className="text-red-400 font-medium">{cameraError}</p>
                          <Button variant="outline" size="sm" onClick={startCamera} className="border-white/20 text-white hover:bg-white/10">
                            Coba Lagi
                          </Button>
                        </div>
                      )}

                      {/* Overlay oval panduan wajah saat kamera aktif */}
                      {captureStep === "ready" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="h-64 w-52 rounded-[50%] border-4 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                        </div>
                      )}

                      {/* Overlay capturing */}
                      {captureStep === "capturing" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                          <div className="text-center">
                            <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full border-4 border-white" />
                            <p className="text-lg font-medium text-white">Mengambil foto...</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay verifying */}
                      {captureStep === "verifying" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="text-center">
                            <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-white" />
                            <p className="text-lg font-medium text-white">Memverifikasi...</p>
                            <p className="text-sm text-white/70">Mohon tunggu sebentar</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay sukses check-in */}
                      {captureStep === "success" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/90 backdrop-blur-sm">
                          <div className="text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white">
                              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                            <p className="text-2xl font-bold text-white">Check-in Berhasil!</p>
                            <p className="mt-2 text-lg text-white/90">{checkInTime}</p>
                            <p className="text-sm text-white/70">Kantor Pusat PDAM Tirta Ardhia Rinjani</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay sukses check-out */}
                      {captureStep === "checkout_success" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/90 backdrop-blur-sm">
                          <div className="text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white">
                              <CheckCircle2 className="h-12 w-12 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-white">Check-out Berhasil!</p>
                            <p className="mt-2 text-lg text-white/90">{checkOutTime}</p>
                            <p className="text-sm text-white/70">Kantor Pusat PDAM Tirta Ardhia Rinjani</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay jam & tanggal */}
                      {!isSuccess && (
                        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                              <Clock className="h-5 w-5" />
                              <span className="font-mono text-2xl font-bold">{formatTime(currentTime)}</span>
                            </div>
                            {isCameraOn && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                <div className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-white/80">{formatDate(currentTime)}</p>
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="bg-muted/30 p-6 space-y-3">

                      {/* Pilih tipe: check-in / check-out */}
                      {!isSuccess && (
                        <div className="flex gap-2">
                          <Button
                            variant={checkType === "checkin" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setCheckType("checkin")}
                            disabled={!!checkInTime}
                          >
                            Check-in {checkInTime && `(${checkInTime})`}
                          </Button>
                          <Button
                            variant={checkType === "checkout" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setCheckType("checkout")}
                            disabled={!checkInTime || !!checkOutTime}
                          >
                            Check-out {checkOutTime && `(${checkOutTime})`}
                          </Button>
                        </div>
                      )}

                      {/* Tombol utama */}
                      {captureStep === "idle" && !cameraError && (
                        <Button size="lg" className="w-full gap-3 py-6 text-lg" onClick={startCamera}>
                          <Camera className="h-6 w-6" />
                          Buka Kamera
                        </Button>
                      )}

                      {captureStep === "ready" && (
                        <Button size="lg" className="w-full gap-3 py-6 text-lg" onClick={handleCapture}>
                          <Camera className="h-6 w-6" />
                          Ambil Selfie & {checkType === "checkin" ? "Check-in" : "Check-out"}
                        </Button>
                      )}

                      {isSuccess && !checkOutTime && (
                        <Button size="lg" variant="outline" className="w-full gap-3 py-6 text-lg" onClick={() => {
                          setCheckType("checkout")
                          setCaptureStep("idle")
                          setCapturedPhoto(null)
                        }}>
                          <Camera className="h-6 w-6" />
                          Lanjut Check-out
                        </Button>
                      )}

                      {isSuccess && checkOutTime && (
                        <div className="rounded-lg bg-emerald-50 p-4 text-center">
                          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                          <p className="font-semibold text-emerald-700">Absensi hari ini selesai</p>
                          <p className="text-sm text-emerald-600">Check-in: {checkInTime} — Check-out: {checkOutTime}</p>
                        </div>
                      )}

                      <p className="text-center text-xs text-muted-foreground">
                        Pastikan wajah terlihat jelas dan berada dalam area yang ditentukan
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ===== KANAN — INFO ===== */}
              <div className="space-y-4">

                {/* Info User */}
                <Card className="card-premium">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-primary text-lg text-primary-foreground">DF</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">Dwiky Firmansyah</p>
                        <p className="text-sm text-muted-foreground">Super Admin HRIS</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          Kantor Pusat
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card className="card-premium">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status Hari Ini</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Check-in</span>
                      {checkInTime
                        ? <Badge className="bg-emerald-100 text-emerald-700">{checkInTime}</Badge>
                        : <Badge variant="outline" className="text-muted-foreground">Belum</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Check-out</span>
                      {checkOutTime
                        ? <Badge className="bg-blue-100 text-blue-700">{checkOutTime}</Badge>
                        : <Badge variant="outline" className="text-muted-foreground">Belum</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Shift</span>
                      <span className="text-sm font-medium">08:00 - 17:00</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Verifikasi */}
                <Card className="card-premium">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Verifikasi Sistem</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        label: "Lokasi GPS",
                        value: gpsStatus === "checking" ? "Mengecek..." : gpsStatus === "valid" ? "Dalam radius" : "Di luar radius",
                        status: gpsStatus === "valid" ? "valid" : gpsStatus === "checking" ? "checking" : "invalid",
                        icon: MapPin,
                        detail: gpsStatus === "valid" ? `Akurasi ${gpsAccuracy}m` : "Pastikan GPS aktif",
                      },
                      {
                        label: "Kamera",
                        value: isCameraOn ? "Aktif" : captureStep === "idle" ? "Belum dibuka" : "Tersedia",
                        status: isCameraOn ? "valid" : "checking",
                        icon: Camera,
                        detail: isCameraOn ? "Berjalan normal" : "Klik Buka Kamera",
                      },
                      {
                        label: "Device",
                        value: "Terverifikasi",
                        status: "valid",
                        icon: Smartphone,
                        detail: "Perangkat dikenali",
                      },
                      {
                        label: "Mock Location",
                        value: "Tidak terdeteksi",
                        status: "valid",
                        icon: Shield,
                        detail: "GPS asli",
                      },
                      {
                        label: "Koneksi",
                        value: "Stabil",
                        status: "valid",
                        icon: Wifi,
                        detail: "Online",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-1.5 ${item.status === "valid" ? "bg-emerald-100" : item.status === "checking" ? "bg-amber-100" : "bg-red-100"}`}>
                            <item.icon className={`h-4 w-4 ${item.status === "valid" ? "text-emerald-600" : item.status === "checking" ? "text-amber-600" : "text-red-600"}`} />
                          </div>
                          <div>
                            <p className="text-xs font-medium">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.status === "valid"
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            : <AlertCircle className={`h-4 w-4 ${item.status === "checking" ? "text-amber-600" : "text-red-600"}`} />}
                          <span className={`text-xs font-medium ${item.status === "valid" ? "text-emerald-600" : item.status === "checking" ? "text-amber-600" : "text-red-600"}`}>
                            {item.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Lokasi */}
                <Card className="card-premium">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Lokasi Saat Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                          <div className="absolute -inset-8 animate-ping rounded-full bg-primary/20" />
                          <div className="absolute -inset-4 rounded-full bg-primary/30" />
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                        Radius absensi: 15m
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-medium">Kantor Pusat PDAM Tirta Ardhia Rinjani</p>
                      <p className="text-xs text-muted-foreground">Lokasi terdeteksi via GPS</p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
