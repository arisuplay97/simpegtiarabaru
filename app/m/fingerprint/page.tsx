"use client"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, X, Clock, WifiOff, RefreshCw, CheckCircle2, CloudUpload, ShieldAlert, AlertTriangle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Lottie from "lottie-react"
import fingerprintAnimation from "@/public/animations/fingerprint.json"
import successAnimation from "@/public/animations/success.json"
import happyAnimation from "@/public/animations/mood/happy.json"
import neutralAnimation from "@/public/animations/mood/neutral.json"
import tiredAnimation from "@/public/animations/mood/tired.json"
import sadAnimation from "@/public/animations/mood/sad.json"
import angryAnimation from "@/public/animations/mood/angry.json"
import { cn } from "@/lib/utils"
import { detectFakeGps } from "@/lib/pwa/anti-fake-gps"
import { FakeGpsModal } from "@/components/mobile/fake-gps-modal"
import { queueMobileAbsensi, syncMobileOfflineQueue, getMobileQueue } from "@/lib/offline/absensi-queue"
import { triggerHaptic } from "@/lib/pwa/haptics"
import { saveEmployeeMood } from "@/lib/actions/mood"
import { MoodType } from "@prisma/client"

// Helper kalkulasi jarak Haversine (meter)
function hitungJarak(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function WatermarkClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const updateTime = () => setTime(new Date())

    const now = new Date()
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    let intervalId: NodeJS.Timeout | null = null
    const timeoutId = setTimeout(() => {
      updateTime()
      intervalId = setInterval(updateTime, 60000)
    }, Math.max(msUntilNextMinute, 500))

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
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
  const [resultData, setResultData] = useState<{
    status: string
    tipe: string
    waktu?: string
    menitTerlambat?: number
  } | null>(null)

  // Employee Experience — Mood Tracker State
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [moodSubmitted, setMoodSubmitted] = useState(false)
  const [isSavingMood, setIsSavingMood] = useState(false)
  const [showMoodPopup, setShowMoodPopup] = useState(false)
  
  // Data Pegawai & Summary
  const [pegawaiData, setPegawaiData] = useState<any>(null)
  const [summaryData, setSummaryData] = useState<any>(null)
  
  // Sesi Absensi Aktif: PAGI | SIANG | SORE
  const [activeSession, setActiveSession] = useState<"PAGI" | "SIANG" | "SORE">(() => {
    const h = new Date().getHours()
    const m = new Date().getMinutes()
    const totalM = h * 60 + m
    if (totalM >= 690 && totalM <= 870) return "SIANG" // 11:30 - 14:30
    if (totalM > 870) return "SORE"
    return "PAGI"
  })

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
      
      const todayStr = format(new Date(), "yyyy-MM-dd")
      const todayItems = q.filter(item => format(new Date(item.timestamp), "yyyy-MM-dd") === todayStr)
      const hasQueuedIn = todayItems.some(i => i.tipe === "CHECK_IN")
      const hasQueuedMid = todayItems.some(i => i.tipe === "CHECK_MIDDAY")
      const hasQueuedOut = todayItems.some(i => i.tipe === "CHECK_OUT")

      if (hasQueuedIn && !hasQueuedMid && summaryData?.wajibAbsenSiang) {
        setActiveSession("SIANG")
      } else if (hasQueuedIn && !hasQueuedOut) {
        setActiveSession("SORE")
      }
    } catch {}
  }

  const checkStatus = async () => {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd")
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        setPegawaiData(p)
        const s = await getEmployeeAttendanceSummary(p.id)
        if (s) {
          setSummaryData(s)
          try {
            localStorage.setItem("attendance_today", JSON.stringify({
              date: todayStr,
              sudahAbsenMasuk: Boolean(s.sudahAbsenMasuk),
              sudahAbsenSiang: Boolean(s.sudahAbsenSiang),
              sudahAbsenPulang: Boolean(s.sudahAbsenPulang)
            }))
          } catch {}

          const nowH = new Date().getHours()
          const nowM = new Date().getMinutes()
          const totalM = nowH * 60 + nowM

          if (s.wajibAbsenSiang) {
            // Logika auto select untuk kantor pusat
            if (!s.sudahAbsenMasuk && totalM < 690) {
              setActiveSession("PAGI")
            } else if (!s.sudahAbsenSiang && totalM >= 690 && totalM <= 870) {
              setActiveSession("SIANG")
            } else if (s.sudahAbsenSiang || totalM > 870) {
              setActiveSession("SORE")
            } else if (!s.sudahAbsenMasuk) {
              setActiveSession("PAGI")
            } else {
              setActiveSession("SIANG")
            }
          } else {
            // Logika auto select untuk kantor cabang
            if (!s.sudahAbsenMasuk) {
              setActiveSession("PAGI")
            } else {
              setActiveSession("SORE")
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
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
  }, [summaryData])

  const getLocation = useCallback(() => {
    setIsLocating(true)
    if (!navigator.geolocation) {
      toast.error("Perangkat tidak mendukung geolokasi GPS.")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
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

  // Kalkulasi Status Radius Geofence Sebenarnya (Real-time)
  const geofenceStatus = useMemo(() => {
    if (!location) return null
    if (pegawaiData?.bebasAbsensi) {
      return { isInside: true, distance: 0, maxRadius: 9999, officeName: "Bebas Absensi" }
    }

    const loc = pegawaiData?.lokasiAbsensi
    if (!loc || loc.latitude === undefined || loc.longitude === undefined) {
      // Default fallback radius
      return { isInside: true, distance: 0, maxRadius: 100, officeName: "Area Kantor" }
    }

    let closestDist = hitungJarak(location.lat, location.lng, loc.latitude, loc.longitude)
    let maxRadius = loc.radius || 100

    if (loc.titikKoordinat) {
      try {
        const pts = typeof loc.titikKoordinat === "string" ? JSON.parse(loc.titikKoordinat) : loc.titikKoordinat
        if (Array.isArray(pts)) {
          for (const pt of pts) {
            const d = hitungJarak(location.lat, location.lng, pt.latitude, pt.longitude)
            if (d < closestDist) {
              closestDist = d
              maxRadius = pt.radius || loc.radius || 100
            }
          }
        }
      } catch {}
    }

    const gpsTolerance = Math.min(Math.max(0, location.accuracy), 25)
    const isInside = closestDist <= (maxRadius + gpsTolerance)
    return {
      isInside,
      distance: Math.round(closestDist),
      maxRadius,
      officeName: loc.nama || "Kantor"
    }
  }, [location, pegawaiData])

  const submit = useCallback(async () => {
    triggerHaptic("medium")

    if (fingerprintLottieRef.current) {
      fingerprintLottieRef.current.playSegments([0, 260], true)
    }

    if (!location && isOnline) {
      triggerHaptic("error")
      toast.error("Menunggu koordinat GPS presisi... Pastikan GPS aktif.", { id: "absen-error" })
      return
    }

    // Validasi Geofence sebelum submit jika online dan bukan bebas absensi
    if (isOnline && geofenceStatus && !geofenceStatus.isInside && !pegawaiData?.bebasAbsensi) {
      triggerHaptic("error")
      toast.error(`Anda berada di luar radius kantor (${geofenceStatus.distance}m dari ${geofenceStatus.officeName}). Maksimal radius adalah ${geofenceStatus.maxRadius}m. Silakan mendekat ke area kantor.`, { id: "absen-error", duration: 5000 })
      return
    }

    setIsSubmitting(true)

    const tipePayload = activeSession === "SIANG" 
      ? "CHECK_MIDDAY" 
      : activeSession === "SORE" 
      ? "CHECK_OUT" 
      : "CHECK_IN"

    // 1. JIKA OFFLINE
    if (!isOnline) {
      try {
        await queueMobileAbsensi({
          latitude: location?.lat || 0,
          longitude: location?.lng || 0,
          accuracy: location?.accuracy || 999,
          tipe: tipePayload
        })
        setIsOfflineQueued(true)
        setResultData({
          status: "OFFLINE_QUEUED",
          tipe: tipePayload,
          waktu: format(new Date(), "HH:mm")
        })
        setDone(true)
        setShowMoodPopup(true)
        updateQueueCount()
        triggerHaptic("success")

        try {
          const todayStr = format(new Date(), "yyyy-MM-dd")
          localStorage.setItem("attendance_today", JSON.stringify({
            date: todayStr,
            sudahAbsenMasuk: true,
            sudahAbsenSiang: activeSession === "SIANG",
            sudahAbsenPulang: activeSession === "SORE"
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

    // 2. JIKA ONLINE: Kirim langsung ke Server
    try {
      const payload = {
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        accuracy: location?.accuracy || 999,
        offlineSync: false,
        tipe: tipePayload
      }

      const response = await fetch("/api/absensi/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

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
      const finalTipe = data.tipe || tipePayload
      setResultData({ 
        status: data.status || "HADIR", 
        tipe: finalTipe,
        waktu: data.jamMasuk || format(new Date(), "HH:mm"),
        menitTerlambat: data.menitTerlambat || 0
      })
      setDone(true)
      setShowMoodPopup(true)

      try {
        const todayStr = format(new Date(), "yyyy-MM-dd")
        localStorage.setItem("attendance_today", JSON.stringify({
          date: todayStr,
          sudahAbsenMasuk: true,
          sudahAbsenSiang: finalTipe === "CHECK_MIDDAY",
          sudahAbsenPulang: finalTipe === "CHECK_OUT"
        }))
      } catch {}
    } catch (err: any) {
      if (!navigator.onLine || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        try {
          await queueMobileAbsensi({
            latitude: location?.lat || 0,
            longitude: location?.lng || 0,
            accuracy: location?.accuracy || 999,
            tipe: tipePayload
          })
          setIsOfflineQueued(true)
          setResultData({
            status: "OFFLINE_QUEUED",
            tipe: tipePayload,
            waktu: format(new Date(), "HH:mm")
          })
          setDone(true)
          setShowMoodPopup(true)
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
  }, [location, isOnline, activeSession, geofenceStatus, pegawaiData])

  // ===== SUCCESS / RECEIPT SCREEN (EMPLOYEE EXPERIENCE) =====
  if (done) {
    const isCheckIn = resultData?.tipe === "CHECK_IN"
    const isMidday = resultData?.tipe === "CHECK_MIDDAY"
    const isCheckOut = resultData?.tipe === "CHECK_OUT"

    const isLate = resultData?.status === "TERLAMBAT"
    const menitTerlambat = resultData?.menitTerlambat || 0
    const isSeverelyLate = isLate && menitTerlambat >= 30

    // Konfigurasi Ucapan Pagi (Employee Experience - Seksi 1)
    const morningGreeting = isSeverelyLate
      ? {
          emoji: "😭",
          title: "Aduh… kamu terlambat cukup lama hari ini 🥺",
          subtitle: "Semoga besok perjalananmu lebih lancar dan bisa datang tepat waktu.",
          badge: `Terlambat ${menitTerlambat} menit`,
          badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        }
      : isLate
      ? {
          emoji: "😅",
          title: "Hehe… hari ini agak telat.",
          subtitle: "Besok kita coba lebih pagi lagi ya! 💪",
          badge: menitTerlambat > 0 ? `Terlambat ${menitTerlambat} menit` : "Terlambat",
          badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        }
      : {
          emoji: "🥳",
          title: "Yeay! Kamu datang tepat waktu!",
          subtitle: "Awal yang baik untuk memulai hari. Semangat ya! 💪",
          badge: "Tepat Waktu",
          badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        }

    // Pilihan Mood Pulang (Employee Experience - Seksi 2 & 3)
    const MOODS: Array<{
      type: MoodType
      emoji: string
      animation: any
      label: string
      title: string
      subtitle: string
    }> = [
      {
        type: "HAPPY",
        emoji: "😊",
        animation: happyAnimation,
        label: "Senang",
        title: "Yeay! Kamu pulang dengan perasaan senang! 🥳",
        subtitle: "Aku ikut happy 😆 Sampai jumpa besok!",
      },
      {
        type: "NEUTRAL",
        emoji: "😐",
        animation: neutralAnimation,
        label: "Biasa",
        title: "Hari ini biasa saja ya? 😌",
        subtitle: "Semoga besok ada lebih banyak hal yang bikin kamu tersenyum!",
      },
      {
        type: "TIRED",
        emoji: "😫",
        animation: tiredAnimation,
        label: "Capek",
        title: "Capek ya hari ini? 🥹",
        subtitle: "Kamu sudah melakukan yang terbaik. Sekarang waktunya istirahat.",
      },
      {
        type: "SAD",
        emoji: "😔",
        animation: sadAnimation,
        label: "Sedih",
        title: "Hari ini terasa berat ya? 🥺",
        subtitle: "Istirahat yang cukup. Semoga besok jadi hari yang lebih baik.",
      },
      {
        type: "ANGRY",
        emoji: "😡",
        animation: angryAnimation,
        label: "Kesal",
        title: "Hari ini cukup melelahkan ya? 😮‍💨",
        subtitle: "Tinggalkan dulu urusan kantor, waktunya pulang dan istirahat.",
      },
    ]

    const activeMoodConfig = MOODS.find(m => m.type === selectedMood)

    const handleSelectMood = async (mood: MoodType) => {
      triggerHaptic("medium")
      setSelectedMood(mood)
      setMoodSubmitted(true)
      setIsSavingMood(true)
      try {
        await saveEmployeeMood(mood)
      } catch (err) {
        console.error("Gagal menyimpan mood:", err)
      } finally {
        setIsSavingMood(false)
      }
    }

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-zinc-100/90 dark:bg-[#09090b] select-none relative">
        {/* CARD HASIL PRESENSI (BERSIH & TERPISAH DARI EMOJI) */}
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] p-6 flex flex-col items-center border border-zinc-200/90 dark:border-zinc-800 shadow-2xl relative overflow-hidden">
          
          {/* Accent Line */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1.5",
            isOfflineQueued 
              ? "bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500" 
              : isMidday
              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
              : isCheckIn 
              ? (isSeverelyLate 
                  ? "bg-gradient-to-r from-rose-500 to-amber-500" 
                  : isLate 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500" 
                  : "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500")
              : "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
          )} />

          {/* Close button X (Cepat kembali) */}
          <button
            onClick={() => router.push("/m/dashboard")}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 1. KONDISI ABSEN MASUK (PAGI) */}
          {isCheckIn && (
            <div className="w-full flex flex-col items-center text-center mt-2">
              <div className="text-5xl my-2 animate-bounce">
                {morningGreeting.emoji}
              </div>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug px-2">
                {morningGreeting.title}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 px-3 leading-relaxed">
                {morningGreeting.subtitle}
              </p>

              <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-tight shadow-2xs">
                <span className={cn("px-2.5 py-0.5 rounded-full border text-[11px]", morningGreeting.badgeColor)}>
                  {morningGreeting.badge}
                </span>
                <span className="text-zinc-600 dark:text-zinc-300 font-semibold tabular-nums">
                  Pukul {resultData?.waktu || format(new Date(), "HH:mm")} WITA
                </span>
              </div>
            </div>
          )}

          {/* 2. KONDISI ABSEN PULANG (SORE) */}
          {isCheckOut && (
            <div className="w-full flex flex-col items-center text-center mt-1">
              <div className="w-16 h-16 flex items-center justify-center mb-1">
                <Lottie animationData={successAnimation} loop={false} className="w-full h-full" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Presensi Pulang Berhasil! ✨
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Terima kasih atas kerja keras & dedikasimu hari ini. Selamat beristirahat!
              </p>
            </div>
          )}

          {/* 3. KONDISI ABSEN SIANG */}
          {isMidday && (
            <div className="w-full flex flex-col items-center text-center mt-2">
              <div className="w-20 h-20 flex items-center justify-center my-1">
                <Lottie animationData={successAnimation} loop={false} className="w-full h-full" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Presensi Siang Berhasil! 🍽️
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-3">
                Selamat beristirahat dan makan siang. Tetap semangat untuk sesi sore nanti!
              </p>
            </div>
          )}

          {/* Status Mood pada Card (Jika Sudah Dipilih) atau Tombol Buka Popup */}
          {selectedMood && activeMoodConfig ? (
            <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold animate-in fade-in">
              <div className="w-5 h-5 flex items-center justify-center pointer-events-none">
                <Lottie animationData={activeMoodConfig.animation} loop={false} className="w-full h-full" />
              </div>
              <span>Suasana Hati: <strong>{activeMoodConfig.label}</strong></span>
              <button 
                onClick={() => setShowMoodPopup(true)} 
                className="text-[10px] text-purple-600 dark:text-purple-400 underline ml-1 font-normal"
              >
                Ubah
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMoodPopup(true)}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-semibold transition-all active:scale-95 border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Gimana perasaanmu hari ini?</span>
            </button>
          )}

          {/* Rincian Tiket / Bukti Kehadiran */}
          <div className="w-full space-y-2 bg-zinc-50/80 dark:bg-zinc-800/40 p-3.5 rounded-2xl my-4 border border-zinc-200/70 dark:border-zinc-800 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Waktu Presensi</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                {resultData?.waktu || format(new Date(), "HH:mm")} WITA · {format(new Date(), "dd MMM yyyy", { locale: idLocale })}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-200/50 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Sesi Presensi</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {isMidday ? "Absen Siang" : isCheckIn ? "Absen Masuk (Pagi)" : "Absen Pulang (Sore)"}
              </span>
            </div>

            {location && (
              <div className="flex justify-between items-center py-0.5 border-t border-zinc-200/50 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Akurasi GPS</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  ±{Math.round(location.accuracy)} meter
                </span>
              </div>
            )}
          </div>

          {/* Tombol Aksi Utama */}
          <div className="w-full space-y-2">
            <button 
              onClick={() => router.push("/m/dashboard")} 
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-3.5 font-bold text-sm shadow-[0_4px_16px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
            >
              Selesai & Kembali ke Beranda
            </button>
          </div>
        </div>

        {/* ===== POPUP EMOTICON DI TENGAH (MODAL EMPLOYEE EXPERIENCE) ===== */}
        {showMoodPopup && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div 
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[28px] p-5 sm:p-6 shadow-2xl border border-zinc-200/90 dark:border-zinc-800 flex flex-col items-center relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button X */}
              <button
                onClick={() => setShowMoodPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>

              {!moodSubmitted ? (
                <>
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-bold tracking-tight mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Employee Experience</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight text-center">
                    Gimana perasaanmu hari ini?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center leading-relaxed px-2">
                    Ekspresikan suasana hatimu setelah beraktivitas. Jawabanmu terjaga anonim & rahasia.
                  </p>

                  {/* 5 Animasi Emojis Lottie (.json internal) - Ukuran Lebih Besar */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full my-5">
                    {MOODS.map((m) => (
                      <button
                        key={m.type}
                        onClick={() => handleSelectMood(m.type)}
                        className={cn(
                          "flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl border transition-all active:scale-90 shadow-xs",
                          selectedMood === m.type
                            ? "bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30"
                            : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border-zinc-200/80 dark:border-zinc-700/60"
                        )}
                      >
                        {/* Lottie Animation: 52px - 56px (lebih dari 2x lebih besar dari 24px) */}
                        <div className="w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center pointer-events-none">
                          <Lottie 
                            animationData={m.animation} 
                            loop={true} 
                            autoplay={true}
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold mt-1 text-zinc-800 dark:text-zinc-200 truncate w-full text-center">
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Action Link: Lewati */}
                  <button
                    onClick={() => setShowMoodPopup(false)}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1 transition-colors active:scale-95"
                  >
                    Lewati untuk sekarang
                  </button>
                </>
              ) : (
                /* Konfirmasi Setelah Memilih Mood */
                <div className="w-full flex flex-col items-center text-center py-2 animate-in fade-in zoom-in-95 duration-200">
                  {/* Animasi Lottie Terpilih: Sangat Besar (w-28 h-28 / 112px!) */}
                  <div className="w-28 h-28 my-2 flex items-center justify-center pointer-events-none">
                    {activeMoodConfig?.animation ? (
                      <Lottie 
                        animationData={activeMoodConfig.animation} 
                        loop={true} 
                        autoplay={true}
                        className="w-full h-full"
                      />
                    ) : (
                      <span className="text-6xl">{activeMoodConfig?.emoji}</span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug px-2 mt-1">
                    {activeMoodConfig?.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 px-3 leading-relaxed">
                    {activeMoodConfig?.subtitle}
                  </p>

                  <div className="w-full mt-6 space-y-2">
                    <button
                      onClick={() => router.push("/m/dashboard")}
                      className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold text-sm shadow-[0_4px_16px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                    >
                      Selesai
                    </button>
                    <button
                      onClick={() => setShowMoodPopup(false)}
                      className="w-full text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 py-1 transition-colors"
                    >
                      Lihat Bukti Presensi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }


  // ===== MAIN SCANNER SCREEN =====
  const isPusat = summaryData?.wajibAbsenSiang ?? true

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
          
          <div>
            <p className="text-white font-bold text-sm leading-tight">ASIK Mobile</p>
            <p className="text-zinc-500 text-[10px] leading-tight font-medium">
              {isPusat ? "Kantor Pusat (3x Absen)" : "Kantor Cabang (2x Absen)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              Mode Offline
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-emerald-400" />
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

      {/* Type Switcher (3 Sesi untuk Pusat, 2 Sesi untuk Cabang) */}
      {isPusat ? (
        <div className="flex bg-[#18181b] border border-[#27272a] rounded-full p-1 max-w-sm w-full shadow-inner mb-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveSession("PAGI")
            }}
            className={cn(
              "flex-1 py-1.5 px-2.5 rounded-full text-xs font-bold transition-all text-center",
              activeSession === "PAGI"
                ? "bg-emerald-600 text-white shadow-[0_2px_12px_rgba(5,150,105,0.4)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Pagi (Masuk)
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveSession("SIANG")
            }}
            className={cn(
              "flex-1 py-1.5 px-2.5 rounded-full text-xs font-bold transition-all text-center",
              activeSession === "SIANG"
                ? "bg-amber-600 text-white shadow-[0_2px_12px_rgba(217,119,6,0.4)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Siang
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveSession("SORE")
            }}
            className={cn(
              "flex-1 py-1.5 px-2.5 rounded-full text-xs font-bold transition-all text-center",
              activeSession === "SORE"
                ? "bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Sore (Pulang)
          </button>
        </div>
      ) : (
        <div className="flex bg-[#18181b] border border-[#27272a] rounded-full p-1 max-w-xs w-full shadow-inner mb-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveSession("PAGI")
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all text-center",
              activeSession === "PAGI"
                ? "bg-emerald-600 text-white shadow-[0_2px_12px_rgba(5,150,105,0.4)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Absen Pagi (Masuk)
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light")
              setActiveSession("SORE")
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all text-center",
              activeSession === "SORE"
                ? "bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Absen Sore (Pulang)
          </button>
        </div>
      )}

      {/* Central Interactive Scanning Zone with Preserved Lottie Animation */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-4 my-auto">
        <button 
          onClick={submit}
          disabled={isSubmitting || (isOnline && !location)}
          className="relative group active:scale-95 transition-all disabled:opacity-60 disabled:active:scale-100 flex flex-col items-center justify-center focus:outline-none"
        >
          <div className={cn(
            "w-72 h-72 sm:w-80 sm:h-80 rounded-full relative flex items-center justify-center border-2 border-dashed transition-all duration-300",
            activeSession === "SIANG"
              ? "border-amber-500/30 bg-[radial-gradient(circle,rgba(245,158,11,0.14)_0%,rgba(24,24,27,0.7)_70%)] shadow-[0_0_35px_rgba(245,158,11,0.2)]"
              : activeSession === "SORE"
              ? "border-blue-500/30 bg-[radial-gradient(circle,rgba(37,99,235,0.14)_0%,rgba(24,24,27,0.7)_70%)] shadow-[0_0_35px_rgba(37,99,235,0.2)]"
              : "border-emerald-500/30 bg-[radial-gradient(circle,rgba(16,185,129,0.14)_0%,rgba(24,24,27,0.7)_70%)] shadow-[0_0_35px_rgba(16,185,129,0.2)]",
            isSubmitting && "ring-4 ring-blue-500/30 animate-pulse"
          )}>
            {isSubmitting && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping pointer-events-none" />
            )}

            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#18181b] border-2 border-[#27272a] flex items-center justify-center shadow-2xl overflow-hidden relative">
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
                activeSession === "SIANG" ? "Tap untuk Siang (Offline)" : activeSession === "SORE" ? "Tap untuk Pulang (Offline)" : "Tap untuk Masuk (Offline)"
              ) : activeSession === "SIANG" ? (
                "Tap Layar untuk Absen Siang"
              ) : activeSession === "SORE" ? (
                "Tap Layar untuk Absen Sore (Pulang)"
              ) : (
                "Tap Layar untuk Absen Pagi (Masuk)"
              )}
            </span>
          </div>
        </button>

        {/* Real-time GPS & Geofence Status Indicator */}
        <div className="mt-6 max-w-sm text-center">
          {!isOnline ? (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-amber-500/20">
              <WifiOff className="h-3.5 w-3.5 shrink-0" /> Presensi Tanpa Sinyal (Queue Mode)
            </div>
          ) : !location ? (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-amber-500/20">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> Menghubungkan GPS Satelit...
            </div>
          ) : geofenceStatus?.isInside ? (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-500/20 shadow-xs">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> 
              <span>Dalam Radius {geofenceStatus.officeName} ({geofenceStatus.distance}m · Maks {geofenceStatus.maxRadius}m) · Siap Absen</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-full text-xs font-semibold border border-rose-500/20 shadow-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>Di Luar Radius ({geofenceStatus?.distance}m dari {geofenceStatus?.officeName}, Batas: {geofenceStatus?.maxRadius}m)</span>
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
