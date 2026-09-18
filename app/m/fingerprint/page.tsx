"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, X, Clock, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Lottie from "lottie-react"
import fingerprintAnimation from "@/public/animations/fingerprint.json"
import successAnimation from "@/public/animations/success.json"
import { cn } from "@/lib/utils"

function WatermarkClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!time) {
    return <div className="h-16 w-48 bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse rounded-2xl mb-6" />
  }

  return (
    <div className="rounded-2xl px-6 py-3.5 flex flex-col items-center pointer-events-none mb-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
      <div className="text-3xl font-bold tracking-tight flex items-center gap-2 text-zinc-900 dark:text-zinc-100 tabular-nums">
        <Clock className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
        {format(time, "HH:mm")}
        <span className="text-base font-medium text-zinc-400 dark:text-zinc-500">:{format(time, "ss")}</span>
      </div>
      <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide">
        {format(time, "EEEE, dd MMMM yyyy", { locale: idLocale })}
      </div>
    </div>
  )
}

export default function MobileFingerprint() {
  const { status } = useSession()
  const router = useRouter()
  
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultData, setResultData] = useState<{ status: string; tipe: string; waktu?: string } | null>(null)
  const [isCheckout, setIsCheckout] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fingerprintLottieRef = useRef<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      getLocation()
      checkStatus()
    }
  }, [status])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        const s = await getEmployeeAttendanceSummary(p.id)
        if (s?.sudahAbsenMasuk && !s?.sudahAbsenPulang) {
          setIsCheckout(true)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const getLocation = useCallback(() => {
    setIsLocating(true)
    if (!navigator.geolocation) {
      toast.error("Perangkat tidak mendukung geolokasi GPS.")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setIsLocating(false)
      },
      () => {
        toast.error("Aktifkan izin GPS/Lokasi di peramban atau HP Anda.", { id: "gps-error" })
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )

    // Secondary refine
    setTimeout(() => {
      navigator.geolocation?.getCurrentPosition(
        pos => {
          toast.dismiss("gps-error")
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }, 2500)
  }, [])

  const submit = useCallback(async () => {
    if (!location && isOnline) {
      toast.error("Menunggu koordinat GPS... Pastikan GPS aktif.", { id: "absen-error", duration: 4000 })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        accuracy: location?.accuracy || 999,
        offlineSync: !isOnline,
        offlineTimestamp: !isOnline ? Date.now() : undefined
      }

      const response = await fetch("/api/absensi/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Gagal mencatat presensi")

      toast.dismiss("absen-error")
      setResultData({ 
        status: data.status || "HADIR", 
        tipe: data.tipe || (isCheckout ? "CHECK_OUT" : "CHECK_IN"),
        waktu: format(new Date(), "HH:mm")
      })
      setDone(true)
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.", { id: "absen-error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [location, isOnline, isCheckout])

  // ===== SUCCESS SCREEN =====
  if (done) {
    const isCheckIn = resultData?.tipe === "CHECK_IN"
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#09090b]">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-7 flex flex-col items-center border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          
          {/* Accent top indicator */}
          <div className={cn("absolute top-0 left-0 right-0 h-1.5", isCheckIn ? "bg-emerald-600" : "bg-zinc-900 dark:bg-white")} />

          {/* Preserved Lottie Success Animation */}
          <div className="w-48 h-48 flex items-center justify-center my-1">
            <Lottie animationData={successAnimation} loop={false} className="w-full h-full" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">
            {isCheckIn ? "Presensi Masuk Berhasil" : "Presensi Pulang Berhasil"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-1 mb-5">
            Pukul {resultData?.waktu || format(new Date(), "HH:mm")} WITA · {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
          </p>

          <div className="w-full space-y-2.5 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl mb-6 border border-zinc-200/60 dark:border-zinc-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-zinc-400">Metode</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Biometrik Mobile
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-zinc-400">Status</span>
              <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px]">
                {resultData?.status || "HADIR"}
              </span>
            </div>
            {location && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Akurasi GPS</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ±{Math.round(location.accuracy)} meter
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={() => router.push("/m/dashboard")} 
            className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-3.5 font-semibold text-sm shadow-xs active:scale-95 transition-all"
          >
            Selesai & Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  // ===== MAIN SCANNER SCREEN =====
  return (
    <div 
      className="flex flex-col min-h-[100dvh] bg-zinc-50 dark:bg-[#09090b] items-center justify-between"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      {/* Top Header */}
      <div 
        className="w-full max-w-md px-5 py-4 flex justify-between items-center"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <button 
          onClick={() => router.push("/m/dashboard")} 
          className="p-2 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs active:scale-90 transition-transform"
          aria-label="Kembali"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <WifiOff className="h-3 w-3" /> Offline Sync
            </div>
          )}
          <button
            onClick={getLocation}
            className="p-2 rounded-full bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs active:scale-90 transition-transform"
            title="Refresh GPS"
          >
            <RefreshCw className={cn("h-4 w-4", isLocating && "animate-spin text-zinc-900 dark:text-white")} />
          </button>
        </div>
      </div>

      {/* Center Interactive Scanning Zone */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 -mt-6">
        <WatermarkClock />

        <button 
          onClick={submit}
          disabled={isSubmitting || isLoadingStatus || (!isOnline && !location)}
          className="relative group active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex flex-col items-center justify-center focus:outline-none"
        >
          {isSubmitting || isLoadingStatus ? (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-zinc-800 dark:text-zinc-200" />
            </div>
          ) : (
            <div className="w-72 h-72 relative flex items-center justify-center">
              {/* Refined subtle outer halo */}
              <div className="absolute inset-4 rounded-full bg-zinc-200/30 dark:bg-zinc-800/30 blur-xl pointer-events-none" />
              
              {/* Preserved Lottie Fingerprint Animation */}
              <div className="w-full h-full relative z-10">
                <Lottie 
                  lottieRef={fingerprintLottieRef}
                  animationData={fingerprintAnimation} 
                  loop={false}
                  initialSegment={[0, 260]}
                  onLoopComplete={() => {
                    if (fingerprintLottieRef.current) {
                      fingerprintLottieRef.current.playSegments([150, 260], true);
                    }
                  }}
                  onComplete={() => {
                    if (fingerprintLottieRef.current) {
                      fingerprintLottieRef.current.playSegments([150, 260], true);
                    }
                  }}
                  className="w-full h-full" 
                />
              </div>
            </div>
          )}

          {/* Action Pill */}
          <div className="mt-4 text-center z-10">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-6 py-2.5 rounded-full shadow-xs border border-zinc-200/80 dark:border-zinc-800 tracking-wider uppercase inline-flex items-center gap-2">
              {isSubmitting || isLoadingStatus ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memproses Presensi...
                </>
              ) : isCheckout ? (
                "Tap Layar untuk Pulang"
              ) : (
                "Tap Layar untuk Masuk"
              )}
            </span>
          </div>
        </button>

        {/* GPS Status Indicator */}
        <div className="mt-12">
          {!location ? (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-medium border border-amber-500/20">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghubungkan GPS...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full text-xs font-medium border border-emerald-500/20 shadow-2xs">
              <MapPin className="h-3.5 w-3.5" /> Akurasi Lokasi: ±{Math.round(location.accuracy)}m
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
