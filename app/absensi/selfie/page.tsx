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
import { cekDalamRadius, hitungJarak, type LokasiAbsensi } from "@/lib/data/lokasi-store"
import { checkDeviceAndAbsen, getStatusAbsensiHariIni } from "@/lib/actions/absensi"
import { getLokasiList } from "@/lib/actions/lokasi"

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

  // Real data state
  const [pegawaiData, setPegawaiData] = useState<any>(null)
  const [absensiData, setAbsensiData] = useState<any>(null)
  const [shiftData, setShiftData] = useState({ jamMasuk: "08:00", jamKeluar: "16:00" })
  const [isDataLoading, setIsDataLoading] = useState(true)

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<"checking" | "valid" | "invalid">("checking")
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  
  // Geo-Fencing state
  const [lokasiValid, setLokasiValid] = useState<LokasiAbsensi | null>(null)
  const [jarakMeter, setJarakMeter] = useState<number | null>(null)
  const [acaraHariIni, setAcaraHariIni] = useState<LokasiAbsensi | null>(null)
  const [lokasiLoaded, setLokasiLoaded] = useState(false)

  // Jam real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load status absensi hari ini
  const fetchStatus = useCallback(async () => {
    const data = await getStatusAbsensiHariIni()
    if (data) {
      setPegawaiData(data.pegawai)
      setAbsensiData(data.absensi)
      setShiftData(data.shift)
      
      if (data.absensi?.jamMasuk) {
        setCheckInTime(new Date(data.absensi.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" }))
        // Jika sudah check-in tapi belum checkout, default ke checkout mode
        if (!data.absensi.jamKeluar) setCheckType("checkout")
      }
      if (data.absensi?.jamKeluar) {
        setCheckOutTime(new Date(data.absensi.jamKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" }))
        setCaptureStep(checkType === "checkin" ? "success" : "checkout_success")
      }
    }
    setIsDataLoading(false)
  }, [checkType])

  // Cek GPS & Device ID saat halaman dibuka
  useEffect(() => {
    // 1. Generate & get Device ID for Anti-Titip Absen
    let deviceId = localStorage.getItem("tris_device_id")
    if (!deviceId) {
      deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
      localStorage.setItem("tris_device_id", deviceId)
    }

    // 2. Fetch status absensi & lokasi dari database, lalu cek GPS
    const run = async () => {
      try {
        const statusRes = await getStatusAbsensiHariIni()
        const dbLokasi = await getLokasiList()
        
        // Simpan data pegawai ke state agar sinkron
        if (statusRes) {
          setPegawaiData(statusRes.pegawai)
          setAbsensiData(statusRes.absensi)
          setShiftData(statusRes.shift)
        }

        // Map ke tipe LokasiAbsensi
        const lokasiList: LokasiAbsensi[] = dbLokasi.map((l: any) => ({
          id: l.id,
          nama: l.nama,
          tipe: l.tipe as any,
          alamat: l.alamat || "",
          latitude: l.latitude,
          longitude: l.longitude,
          radius: l.radius,
          aktif: l.aktif,
          tanggalMulai: l.tanggalMulai ?? undefined,
          tanggalSelesai: l.tanggalSelesai ?? undefined,
          wajibHadir: l.wajibHadir ?? false,
          keterangan: l.keterangan ?? undefined,
        }))

        // Cek acara wajib hari ini
        const today = new Date().toISOString().split("T")[0]
        const acara = lokasiList.find(l =>
          l.tipe === "acara" && l.aktif && l.wajibHadir &&
          l.tanggalMulai && l.tanggalSelesai &&
          today >= l.tanggalMulai && today <= l.tanggalSelesai
        ) ?? null
        setAcaraHariIni(acara)

        const lokasiUntukCek = acara
          ? [acara]
          : lokasiList.filter(l => l.aktif && l.tipe !== "acara")

        setLokasiLoaded(true)

        // 3. Cek GPS
        if (!navigator.geolocation) {
          setGpsStatus("invalid")
          return
        }

        // Jika BEBAS ABSENSI aktif, langsung set valid
        if (statusRes?.pegawai?.bebasAbsensi) {
          setGpsStatus("valid")
          setLokasiValid({
            id: "bebas",
            nama: "Bebas Lokasi (Akses Khusus)",
            tipe: "kantor_pusat",
            alamat: "Akses Global",
            latitude: 0,
            longitude: 0,
            radius: 999999,
            aktif: true
          })
          return
        }

        // Jika ada LOKASI TERIKAT (Binding)
        let lokasiFilter = lokasiUntukCek
        if (statusRes?.pegawai?.lokasiAbsensi) {
          lokasiFilter = [statusRes.pegawai.lokasiAbsensi as any]
          toast.info(`Lokasi Terikat: ${statusRes.pegawai.lokasiAbsensi.nama}`)
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            setGpsAccuracy(Math.round(pos.coords.accuracy))
            const hasil = cekDalamRadius(lat, lng, lokasiFilter)
            
            if (hasil.valid) {
              setGpsStatus("valid")
              setLokasiValid(hasil.lokasi ?? null)
              setJarakMeter(hasil.jarak ?? null)
              toast.success(`Lokasi Terdeteksi: ${hasil.lokasi?.nama} (${hasil.jarak}m)`)
            } else {
              setGpsStatus("invalid")
              setLokasiValid(null)
              // DEBUG INFO UNTUK USER
              if (lokasiFilter.length > 0) {
                const distances = lokasiFilter.map(l => ({
                   nama: l.nama,
                   jarak: Math.round(hitungJarak(lat, lng, l.latitude, l.longitude))
                })).sort((a, b) => a.jarak - b.jarak)
                const terdekat = distances[0]
                setJarakMeter(terdekat.jarak)
                toast.error(`Di luar area. Terdekat: ${terdekat.nama} (${terdekat.jarak}m).`, { duration: 10000 })
              }
            }
          },
          () => {
            setGpsStatus("invalid")
            toast.error("Gagal mendapatkan posisi GPS. Pastikan GPS aktif dan izin diberikan.")
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
      } catch {
        setGpsStatus("invalid")
        setLokasiLoaded(true)
      }
    }
    run()
    fetchStatus()
  }, [fetchStatus])

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
    let photoDataUrl = ""
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedPhoto(photoDataUrl)
    }
    
    setCaptureStep("verifying")

    // Matikan Perekaman Kamera di belakang layar tanpa mengubah state UI
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    // Ambil Device ID dari localStorage
    const clientDeviceId = localStorage.getItem("tris_device_id") || "unknown"

    // Kirim Ke Backend Verifikasi Validasi "Titip Absen Perangkat"
    const result = await checkDeviceAndAbsen(checkType, clientDeviceId, photoDataUrl, jarakMeter)
    
    if (result.error) {
      toast.error(result.error, { duration: 6000 })
      handleReset() // Kembalikan ke siap jika gagal
    } else if (result.success) {
      setCaptureStep(checkType === "checkin" ? "success" : "checkout_success")
      const now = formatTime(new Date())
      if (checkType === "checkin") setCheckInTime(now)
      else setCheckOutTime(now)
      
      toast.success(result.success)
      setIsCameraOn(false)
      fetchStatus() // Refresh data
    }
  }

  // Reset untuk coba lagi
  const handleReset = () => {
    setCapturedPhoto(null)
    setCaptureStep("idle")
    setIsCameraOn(false)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Makassar" })

  const formatDate = (date: Date) =>
    date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const isSuccess = captureStep === "success" || captureStep === "checkout_success"

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
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

            {/* Banner acara wajib */}
            {acaraHariIni && (
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-4 text-center sm:text-left">
                <p className="text-sm font-semibold text-purple-800">📢 Acara Wajib Hari Ini</p>
                <p className="text-sm text-purple-700 mt-1 font-bold">{acaraHariIni.nama}</p>
                {acaraHariIni.keterangan && <p className="text-xs text-purple-600 italic">"{acaraHariIni.keterangan}"</p>}
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  Seluruh pegawai WAJIB absen di lokasi acara ini. Absen kantor dinonaktifkan sementara.
                </p>
              </div>
            )}

            {/* Info lokasi valid */}
            {lokasiValid && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-4 text-center sm:text-left">
                <p className="text-sm text-emerald-700">
                  ✓ Anda berada di <strong>{lokasiValid.nama}</strong>
                  {jarakMeter !== null && ` (${jarakMeter}m dari titik absensi)`}
                </p>
              </div>
            )}

            {/* Info lokasi tidak valid */}
            {gpsStatus === "invalid" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-center sm:text-left">
                <p className="text-sm text-red-700 font-medium">
                  ✗ Anda berada di luar area absensi atau GPS tidak aktif
                </p>
                {acaraHariIni ? (
                  <p className="text-xs text-red-600 mt-1">
                    Hari ini harus absen di: <strong>{acaraHariIni.nama}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">
                    Pastikan Anda berada di kantor pusat atau kantor cabang yang terdaftar
                  </p>
                )}
              </div>
            )}

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
                            <p className="text-sm text-white/70">{lokasiValid?.nama ?? "Lokasi Utama"}</p>
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
                            <p className="text-sm text-white/70">{lokasiValid?.nama ?? "Lokasi Utama"}</p>
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
                        <Button size="lg" className="w-full gap-3 py-6 text-lg" onClick={startCamera} disabled={gpsStatus !== "valid"}>
                          <Camera className="h-6 w-6" />
                          {gpsStatus !== "valid" ? "Di Luar Area" : "Buka Kamera"}
                        </Button>
                      )}

                      {captureStep === "ready" && (
                        <Button 
                          size="lg" 
                          className="w-full gap-3 py-6 text-lg" 
                          onClick={handleCapture}
                          disabled={
                            checkType === "checkout" && 
                            currentTime.getHours() < Number(shiftData.jamKeluar.split(":")[0])
                          }
                        >
                          <Camera className="h-6 w-6" />
                          {checkType === "checkout" && currentTime.getHours() < Number(shiftData.jamKeluar.split(":")[0])
                            ? `Checkout Jam ${shiftData.jamKeluar}`
                            : `Ambil Selfie & ${checkType === "checkin" ? "Check-in" : "Check-out"}`
                          }
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
                        <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                          {pegawaiData?.nama?.split(" ").map((n: any) => n[0]).join("").substring(0, 2) || "..."}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {isDataLoading ? (
                          <div className="space-y-2">
                            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold">{pegawaiData?.nama || "Pegawai"}</p>
                            <p className="text-sm text-muted-foreground">{pegawaiData?.jabatan || "Jabatan"}</p>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {pegawaiData?.unit || "Unit Kerja"}
                            </div>
                          </>
                        )}
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
                      <span className="text-sm font-medium">{shiftData.jamMasuk} - {shiftData.jamKeluar}</span>
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
                        Radius absensi: {lokasiValid?.radius ?? 100}m
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-medium">{lokasiValid?.nama ?? "Mencari Lokasi..."}</p>
                      <p className="text-xs text-muted-foreground">{gpsStatus === "valid" && jarakMeter ? `Berjarak ${jarakMeter} meter dari titik` : "Lokasi terdeteksi via GPS"}</p>
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
