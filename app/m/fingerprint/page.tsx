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
    return <div className="w-full max-w-md h-20 bg-[#18181b] border border-[#27272a] animate-pulse rounded-2xl mb-4" />
  }

  return (
    <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-4 text-center shadow-lg mb-4 pointer-events-none">
      <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums leading-none">
        {format(time, "HH:mm")}
      </div>
      <div className="text-xs font-medium text-zinc-400 mt-1.5 capitalize">
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
  const [isCheckout, setIsCheckout] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd")
      const cached = localStorage.getItem("attendance_today")
      if (cached) {
        const d = JSON.parse(cached)
        if (d.date === todayStr) {
          if (d.sudahAbsenMasuk && !d.sudahAbsenPulang) return true
          if (!d.sudahAbsenMasuk) return false
        }
      }
    } catch {}
    // Smart default: jam 12:00 ke atas default ke Pulang (Sore), sebelum jam 12:00 default ke Masuk (Pagi)
    return new Date().getHours() >= 12
  })
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  // Anti-Fake GPS State
  const [showFakeGpsModal, setShowFakeGpsModal] = useState(false)
  const [fakeGpsReason, setFakeGpsReason] = useState("")
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fingerprintLottieRef = useRef<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined" && !navigator.onLine) {
        console.warn("PWA sedang offline: mempertahankan scanner absensi offline")
        getLocation()
        checkStatus()
        updateQueueCount()
        return
      }
      router.push("/login")
    }
    if (status === "authenticated" || (typeof window !== "undefined" && !navigator.onLine)) {
      getLocation()
      checkStatus()
      updateQueueCount()
    }
  }, [status])

  const updateQueueCount = async () => {
    try {
      const q = await getMobileQueue()
      setPendingQueueCount(q.length)
      
      // Jika ada item antrian offline hari ini, sesuaikan status arah absen
      const todayStr = format(new Date(), "yyyy-MM-dd")
      const todayItems = q.filter(item => format(new Date(item.timestamp), "yyyy-MM-dd") === todayStr)
      const hasQueuedIn = todayItems.some(i => i.tipe === "CHECK_IN")
      const hasQueuedOut = todayItems.some(i => i.tipe === "CHECK_OUT")
      if (hasQueuedIn && !hasQueuedOut) {
        setIsCheckout(true)
      }
    } catch {}
  }

  const checkStatus = async () => {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd")
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        const s = await getEmployeeAttendanceSummary(p.id)
        if (s) {
          try {
            localStorage.setItem("attendance_today", JSON.stringify({
              date: todayStr,
              sudahAbsenMasuk: Boolean(s.sudahAbsenMasuk),
              sudahAbsenPulang: Boolean(s.sudahAbsenPulang)
            }))
          } catch {}

          if (s.sudahAbsenMasuk && !s.sudahAbsenPulang) {
            // Sudah absen pagi dan sekarang waktunya absen sore -> langsung arahkan ke Absen Pulang
            setIsCheckout(true)
          } else if (!s.sudahAbsenMasuk) {
            // Belum absen pagi -> langsung arahkan ke Absen Pagi (Masuk)
            setIsCheckout(false)
          } else if (s.sudahAbsenMasuk && s.sudahAbsenPulang) {
            setIsCheckout(true)
          }
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

    // Jalankan animasi pemindaian Lottie fingerprint secara penuh
    if (fingerprintLottieRef.current) {
      fingerprintLottieRef.current.playSegments([0, 260], true)
    }

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

        try {
          const todayStr = format(new Date(), "yyyy-MM-dd")
          localStorage.setItem("attendance_today", JSON.stringify({
            date: todayStr,
            sudahAbsenMasuk: true,
            sudahAbsenPulang: isCheckout
          }))
        } catch {}

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
      const finalTipe = data.tipe || (isCheckout ? "CHECK_OUT" : "CHECK_IN")
      setResultData({ 
        status: data.status || "HADIR", 
        tipe: finalTipe,
        waktu: format(new Date(), "HH:mm")
      })
      setDone(true)

      try {
        const todayStr = format(new Date(), "yyyy-MM-dd")
        localStorage.setItem("attendance_today", JSON.stringify({
          date: todayStr,
          sudahAbsenMasuk: true,
          sudahAbsenPulang: finalTipe === "CHECK_OUT"
        }))
      } catch {}
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

          {/* Lottie Success Animation */}
          <div className="w-28 h-28 flex items-center justify-center my-1">
            <Lottie animationData={successAnimation} loop={false} className="w-full h-full" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center tracking-tight">
            {isOfflineQueued 
              ? (isCheckIn ? "Presensi Masuk (Pagi) Tersimpan" : "Presensi Pulang (Sore) Tersimpan")
              : (isCheckIn ? "Presensi Masuk (Pagi) Berhasil" : "Presensi Pulang (Sore) Berhasil")
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
                {isCheckIn ? "Absen Pagi (Masuk)" : "Absen Sore (Pulang)"}
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
                {isOfflineQueued 
                  ? "Tersimpan Offline (Antrian)" 
                  : isCheckIn 
                    ? (resultData?.status === "TERLAMBAT" ? "Terlambat" : "Tepat Waktu") 
                    : (resultData?.status || "HADIR")}
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
      className="flex flex-col min-h-[100dvh] bg-[#09090b] text-zinc-100 items-center justify-between p-4 md:p-5 select-none"
      style={{ 
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" 
      }}
    >
      {/* Top Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-3">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.push("/m/dashboard")} 
            className="p-2 rounded-xl bg-[#18181b] text-zinc-300 border border-[#27272a] shadow-xs active:scale-90 transition-transform"
            aria-label="Kembali"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center overflow-hidden p-0.5">
              <img src="/favicon.PNG" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">ASIK Mobile</p>
              <p className="text-zinc-500 text-[10px] leading-tight font-medium">Presensi Tap Layar</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Mode Offline
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online GPS
            </div>
          )}

          {pendingQueueCount > 0 && isOnline && (
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
              className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold px-2 py-1 rounded-full active:scale-95"
            >
              <CloudUpload className="h-3 w-3" /> ({pendingQueueCount})
            </button>
          )}

          <button
            onClick={getLocation}
            className="p-2 rounded-xl bg-[#18181b] text-zinc-400 hover:text-white border border-[#27272a] shadow-xs active:scale-90 transition-transform"
            title="Refresh GPS"
          >
            <RefreshCw className={cn("h-4 w-4", isLocating && "animate-spin text-white")} />
          </button>
        </div>
      </div>

      {/* Watermark Clock Card */}
      <WatermarkClock />

      {/* Type Switcher (Absen Pagi Masuk / Absen Sore Pulang) */}
      <div className="flex bg-[#18181b] border border-[#27272a] rounded-full p-1 max-w-xs w-full shadow-inner mb-4">
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light")
            setIsCheckout(false)
          }}
          className={cn(
            "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5",
            !isCheckout
              ? "bg-emerald-600 text-white shadow-[0_2px_12px_rgba(5,150,105,0.4)]"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Absen Pagi (Masuk)
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light")
            setIsCheckout(true)
          }}
          className={cn(
            "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5",
            isCheckout
              ? "bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Absen Sore (Pulang)
        </button>
      </div>

      {/* Central Interactive Scanning Zone with Preserved Lottie Animation */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-4 my-auto">
        <button 
          onClick={submit}
          disabled={isSubmitting || (isOnline && !location)}
          className="relative group active:scale-95 transition-all disabled:opacity-60 disabled:active:scale-100 flex flex-col items-center justify-center focus:outline-none"
        >
          {/* Circular Pad styling matching offline.html */}
          <div className={cn(
            "w-64 h-64 rounded-full relative flex items-center justify-center border-2 border-dashed transition-all duration-300",
            isCheckout 
              ? "border-blue-500/30 bg-[radial-gradient(circle,rgba(37,99,235,0.14)_0%,rgba(24,24,27,0.7)_70%)] shadow-[0_0_35px_rgba(37,99,235,0.2)]"
              : "border-emerald-500/30 bg-[radial-gradient(circle,rgba(16,185,129,0.14)_0%,rgba(24,24,27,0.7)_70%)] shadow-[0_0_35px_rgba(16,185,129,0.2)]",
            isSubmitting && "ring-4 ring-blue-500/30 animate-pulse"
          )}>
            {/* Concentric scan radar ring during submission */}
            {isSubmitting && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping pointer-events-none" />
            )}

            {/* Inner circle holding Lottie Animation - ALWAYS MOUNTED AND VISIBLE */}
            <div className="w-48 h-48 rounded-full bg-[#18181b] border-2 border-[#27272a] flex items-center justify-center shadow-xl overflow-hidden relative">
              <div className="w-full h-full p-2 relative z-10 flex items-center justify-center">
                <Lottie 
                  lottieRef={fingerprintLottieRef}
                  animationData={fingerprintAnimation} 
                  loop={isSubmitting}
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
          </div>

          {/* Action Instruction Pill */}
          <div className="mt-5 text-center z-10">
            <span className={cn(
              "text-xs font-bold px-6 py-2.5 rounded-full shadow-lg border tracking-wider uppercase inline-flex items-center gap-2 transition-all",
              isSubmitting
                ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/30"
                : "bg-[#18181b] text-zinc-100 border-[#27272a]"
            )}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  Memproses Presensi...
                </>
              ) : !isOnline ? (
                isCheckout ? "Tap untuk Pulang (Offline)" : "Tap untuk Masuk (Offline)"
              ) : isCheckout ? (
                "Tap Layar untuk Absen Sore (Pulang)"
              ) : (
                "Tap Layar untuk Absen Pagi (Masuk)"
              )}
            </span>
          </div>
        </button>

        {/* GPS Status Indicator */}
        <div className="mt-6">
          {!isOnline ? (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-amber-500/20">
              <WifiOff className="h-3.5 w-3.5" /> Presensi Tanpa Sinyal (Queue Mode)
            </div>
          ) : !location ? (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-amber-500/20">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghubungkan GPS Satelit...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-500/20 shadow-xs">
              <MapPin className="h-3.5 w-3.5" /> Lokasi Akurat: ±{Math.round(location.accuracy)}m (Siap Absen)
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding Info */}
      <div className="w-full max-w-md text-center pt-3 pb-1">
        <p className="text-[10px] text-zinc-400 font-medium leading-none">
          ASIK Mobile · Perumdam Tirta Ardhia Rinjani
        </p>
        <p className="text-[10px] text-white font-bold mt-1 leading-none tracking-tight">
          Inovasi Digital - Tim IT Sekretariat
        </p>
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
