"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, X, Clock, WifiOff, RefreshCw, CheckCircle2, CloudUpload, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Lottie from "lottie-react"
import fingerprintAnimation from "@/public/animations/fingerprint.json"
import successAnimation from "@/public/animations/success.json"
import { cn } from "@/lib/utils"
import { detectFakeGps } from "@/lib/pwa/anti-fake-gps"
import { FakeGpsModal } from "@/components/mobile/fake-gps-modal"
import { queueMobileAbsensi, syncMobileOfflineQueue, getMobileQueue } from "@/lib/offline/absensi-queue"
import { triggerHaptic } from "@/lib/pwa/haptics"

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
  const [isOfflineQueued, setIsOfflineQueued] = useState(false)
  const [pendingQueueCount, setPendingQueueCount] = useState(0)
  const [resultData, setResultData] = useState<{ status: string; tipe: string; waktu?: string } | null>(null)
  const [isCheckout, setIsCheckout] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  // Anti-Fake GPS State
  const [showFakeGpsModal, setShowFakeGpsModal] = useState(false)
  const [fakeGpsReason, setFakeGpsReason] = useState("")
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fingerprintLottieRef = useRef<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      getLocation()
      checkStatus()
      updateQueueCount()
    }
  }, [status])

  const updateQueueCount = async () => {
    try {
      const q = await getMobileQueue()
      setPendingQueueCount(q.length)
    } catch {}
  }

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

  // Automatic Background Sync on Reconnect
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      toast.info("Koneksi kembali online. Menyinkronkan data offline...")
      try {
        const { synced } = await syncMobileOfflineQueue()
        if (synced > 0) {
          toast.success(`${synced} presensi offline berhasil disinkronkan ke server!`)
        }
      } catch {}
      updateQueueCount()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning("Koneksi terputus. Mode offline diaktifkan (presensi akan disimpan di antrian).")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("offline-queue-updated", updateQueueCount)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("offline-queue-updated", updateQueueCount)
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
        // Run Anti-Fake GPS Detection
        const fakeCheck = detectFakeGps(pos)
        if (fakeCheck.isFake) {
          setFakeGpsReason(fakeCheck.reason)
          setShowFakeGpsModal(true)
          setLocation(null)
          setIsLocating(false)
          return
        }

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
          const fakeCheck = detectFakeGps(pos)
          if (fakeCheck.isFake) {
            setFakeGpsReason(fakeCheck.reason)
            setShowFakeGpsModal(true)
            setLocation(null)
            return
          }
          toast.dismiss("gps-error")
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }, 2500)
  }, [])

  const submit = useCallback(async () => {
    // Taptic feedback saat tap dimulai
    triggerHaptic("medium")

    // 1. Pastikan GPS tersedia jika online
    if (!location && isOnline) {
      triggerHaptic("error")
      toast.error("Menunggu koordinat GPS... Pastikan GPS aktif.", { id: "absen-error", duration: 4000 })
      return
    }

    setIsSubmitting(true)

    // 2. JIKA OFFLINE: Simpan langsung ke Offline Queue (IndexedDB)
    if (!isOnline) {
      try {
        await queueMobileAbsensi({
          latitude: location?.lat || 0,
          longitude: location?.lng || 0,
          accuracy: location?.accuracy || 999,
          tipe: isCheckout ? "CHECK_OUT" : "CHECK_IN"
        })
        setIsOfflineQueued(true)
        setResultData({
          status: "OFFLINE_QUEUED",
          tipe: isCheckout ? "CHECK_OUT" : "CHECK_IN",
          waktu: format(new Date(), "HH:mm")
        })
        setDone(true)
        updateQueueCount()
        triggerHaptic("success")
        toast.success("Presensi tersimpan di antrian offline! Akan disinkronkan otomatis saat ada sinyal.")
        return
      } catch (err: any) {
        triggerHaptic("error")
        toast.error(err.message || "Gagal menyimpan presensi offline.")
        return
      } finally {
        setIsSubmitting(false)
      }
    }

    // 3. JIKA ONLINE: Kirim langsung ke Server
    try {
      const payload = {
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        accuracy: location?.accuracy || 999,
        offlineSync: false,
      }

      const response = await fetch("/api/absensi/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      // Deteksi Rejection Fake GPS dari Server
      if (!response.ok) {
        triggerHaptic("error")
        if (data.error && (data.error.toLowerCase().includes("fake") || data.error.toLowerCase().includes("mock"))) {
          setFakeGpsReason(data.error)
          setShowFakeGpsModal(true)
          return
        }
        throw new Error(data.error || "Gagal mencatat presensi")
      }

      toast.dismiss("absen-error")
      triggerHaptic("success")
      setResultData({ 
        status: data.status || "HADIR", 
        tipe: data.tipe || (isCheckout ? "CHECK_OUT" : "CHECK_IN"),
        waktu: format(new Date(), "HH:mm")
      })
      setDone(true)
    } catch (err: any) {
      // Jika fetch gagal karena koneksi tiba-tiba putus di lapangan, fallback simpan offline queue!
      if (!navigator.onLine || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        try {
          await queueMobileAbsensi({
            latitude: location?.lat || 0,
            longitude: location?.lng || 0,
            accuracy: location?.accuracy || 999,
            tipe: isCheckout ? "CHECK_OUT" : "CHECK_IN"
          })
          setIsOfflineQueued(true)
          setResultData({
            status: "OFFLINE_QUEUED",
            tipe: isCheckout ? "CHECK_OUT" : "CHECK_IN",
            waktu: format(new Date(), "HH:mm")
          })
          setDone(true)
          updateQueueCount()
          triggerHaptic("success")
          toast.info("Koneksi terputus saat mengirim. Presensi telah diamankan ke antrian offline.")
          return
        } catch {}
      }
      triggerHaptic("error")
      toast.error(err.message || "Terjadi kesalahan koneksi.", { id: "absen-error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [location, isOnline, isCheckout])

  // ===== SUCCESS / RECEIPT SCREEN (Executive Clean Modern) =====
  if (done) {
    const isCheckIn = resultData?.tipe === "CHECK_IN"
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-5 bg-zinc-100/80 dark:bg-[#09090b]">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[28px] p-6 flex flex-col items-center border border-zinc-200/90 dark:border-zinc-800 shadow-xl relative overflow-hidden">
          
          {/* Top subtle gradient accent line */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1.5",
            isOfflineQueued 
              ? "bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500" 
              : isCheckIn 
              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" 
              : "bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"
          )} />

          {/* Refined Luxury Success Badge */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center tracking-tight">
            {isOfflineQueued 
              ? (isCheckIn ? "Presensi Masuk Tersimpan" : "Presensi Pulang Tersimpan")
              : (isCheckIn ? "Presensi Masuk Berhasil" : "Presensi Pulang Berhasil")
            }
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mt-2 mb-5">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Pukul {resultData?.waktu || format(new Date(), "HH:mm")} WITA</span>
            <span>·</span>
            <span>{format(new Date(), "dd MMM yyyy", { locale: idLocale })}</span>
          </div>

          {/* Digital Receipt Breakdown Box */}
          <div className="w-full space-y-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 p-4 rounded-2xl mb-5 border border-zinc-200/70 dark:border-zinc-800 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-500 dark:text-zinc-400">Metode</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Tap Layar & GPS
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Jenis Presensi</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {isCheckIn ? "Check-In (Masuk)" : "Check-Out (Pulang)"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Status</span>
              <span className={cn(
                "font-bold px-2.5 py-0.5 rounded-full text-[11px] border",
                isOfflineQueued 
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  : resultData?.status === "TERLAMBAT"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              )}>
                {isOfflineQueued ? "Tersimpan Offline (Antrian)" : (resultData?.status || "HADIR")}
              </span>
            </div>

            {location && (
              <div className="flex justify-between items-center py-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400">Akurasi Lokasi</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  ±{Math.round(location.accuracy)} meter
                </span>
              </div>
            )}

            {isOfflineQueued && (
              <div className="mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/60 flex items-center gap-2 text-blue-700 dark:text-blue-300 text-[11px]">
                <CloudUpload className="w-4 h-4 shrink-0 text-blue-500" />
                <p className="leading-tight">
                  Tersimpan aman di memori perangkat. Akan terkirim otomatis saat online.
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={() => router.push("/m/dashboard")} 
            className="w-full rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-3.5 font-bold text-sm shadow-md active:scale-95 transition-all"
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
          {!isOnline ? (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <WifiOff className="h-3 w-3" /> Mode Offline
            </div>
          ) : pendingQueueCount > 0 ? (
            <button
              onClick={async () => {
                const toastId = toast.loading("Menyinkronkan antrian offline...")
                const res = await syncMobileOfflineQueue()
                if (res.synced > 0) {
                  toast.success(`${res.synced} presensi berhasil tersinkron!`, { id: toastId })
                } else if (res.failed > 0) {
                  toast.error(`Gagal sinkronisasi: ${res.errors[0] || "Ditolak server"}`, { id: toastId })
                } else {
                  toast.info("Tidak ada presensi di antrian.", { id: toastId })
                }
                updateQueueCount()
              }}
              className="flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-full active:scale-95"
            >
              <CloudUpload className="h-3 w-3" /> Sync ({pendingQueueCount})
            </button>
          ) : null}

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
          disabled={isSubmitting || isLoadingStatus || (isOnline && !location)}
          className="relative group active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex flex-col items-center justify-center focus:outline-none"
        >
          {isSubmitting || isLoadingStatus ? (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-zinc-800 dark:text-zinc-200" />
            </div>
          ) : (
            <div className="w-72 h-72 relative flex items-center justify-center">
              {/* Subtle outer halo */}
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
              ) : !isOnline ? (
                "Tap untuk Simpan Offline"
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
          {!isOnline ? (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-medium border border-amber-500/20">
              <WifiOff className="h-3.5 w-3.5" /> Presensi Tanpa Sinyal (Queue Mode)
            </div>
          ) : !location ? (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-medium border border-amber-500/20">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghubungkan GPS Satelit...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full text-xs font-medium border border-emerald-500/20 shadow-2xs">
              <MapPin className="h-3.5 w-3.5" /> Akurasi Lokasi: ±{Math.round(location.accuracy)}m
            </div>
          )}
        </div>
      </div>

      {/* POP-UP ANTI FAKE GPS */}
      <FakeGpsModal
        isOpen={showFakeGpsModal}
        reason={fakeGpsReason}
        onCloseAndRetry={() => {
          setShowFakeGpsModal(false)
          setFakeGpsReason("")
          getLocation()
        }}
      />
    </div>
  )
}
