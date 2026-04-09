"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Fingerprint, CheckCircle, Loader2, MapPin, X, Clock, WifiOff, Pointer } from "lucide-react"
import { toast } from "sonner"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

function WatermarkClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="bg-black/5 rounded-2xl px-5 py-3 flex flex-col items-center pointer-events-none mb-8 mt-12 border border-slate-200 shadow-sm">
      <div className="text-4xl font-black tracking-widest flex items-center gap-2 text-slate-800">
        <Clock className="w-7 h-7 text-indigo-600" />
        {format(time, "HH:mm:ss")}
      </div>
      <div className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wide">
        {format(time, "EEEE, dd MMMM yyyy", { locale: idLocale })}
      </div>
    </div>
  )
}

export default function MobileFingerprint() {
  const { status } = useSession()
  const router = useRouter()
  
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resultData, setResultData] = useState<{ status: string; tipe: string } | null>(null)
  const [isCheckout, setIsCheckout] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

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

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => toast.error("Aktifkan GPS / Lokasi di HP Anda.", { id: "gps-error", position: "bottom-center" }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
    setTimeout(() => {
      navigator.geolocation?.getCurrentPosition(
        pos => {
          toast.dismiss("gps-error")
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }, 3000)
  }

  const submit = useCallback(async () => {
    if (!location && isOnline) {
      toast.error("Menunggu lokasi GPS... Pastikan GPS aktif.", { id: "absen-error", duration: 4000, position: "bottom-center" })
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
      if (!response.ok) throw new Error(data.error || "Gagal absensi")

      toast.dismiss("absen-error")
      setResultData({ status: data.status || "HADIR", tipe: data.tipe || "CHECK_IN" })
      setDone(true)
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.", { id: "absen-error", position: "bottom-center" })
    } finally {
      setIsSubmitting(false)
    }
  }, [location, isOnline])

  if (done) {
    const isCheckIn = resultData?.tipe === "CHECK_IN"
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 flex flex-col items-center shadow-lg relative overflow-hidden border border-slate-100">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />
          <div className="h-20 w-20 rounded-full flex items-center justify-center mb-6 ring-8 bg-indigo-50 ring-indigo-50">
            <CheckCircle className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            {isCheckIn ? "Check-In Berhasil" : "Check-Out Berhasil"}
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">Pukul {format(new Date(), "HH:mm")} WITA</p>
          <div className="w-full space-y-2 bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Metode</span>
              <span className="font-bold flex items-center gap-1 text-slate-700">Tap Layar</span>
            </div>
            {location && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Akurasi GPS</span>
                <span className="font-bold text-slate-700">±{Math.round(location.accuracy)}m</span>
              </div>
            )}
          </div>
          <button onClick={() => router.push("/m/dashboard")} className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white py-4 font-bold text-lg shadow-lg shadow-indigo-500/30">
            Selesai
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 items-center justify-between" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
      <div className="w-full p-4 flex justify-between items-start" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <button onClick={() => router.push("/m/dashboard")} className="p-2.5 bg-white rounded-full text-slate-600 shadow-sm border border-slate-200">
          <X className="h-5 w-5" />
        </button>
        {!isOnline && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full">
            <WifiOff className="h-3.5 w-3.5" /> Offline
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 -mt-10">
        <WatermarkClock />
        
        <button 
          onClick={submit}
          disabled={isSubmitting || isLoadingStatus || (!isOnline && !location)}
          className="relative group p-14 rounded-[3rem] active:scale-95 transition-all text-white disabled:opacity-50 disabled:active:scale-100"
          style={{ 
            background: isCheckout 
              ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)" // Darker for checkout
              : "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)", // Blue for checkin
            boxShadow: isCheckout
              ? "0 20px 50px rgba(51, 65, 85, 0.45), inset 0 2px 10px rgba(255, 255, 255, 0.2)"
              : "0 20px 50px rgba(29, 78, 216, 0.45), inset 0 2px 10px rgba(255, 255, 255, 0.4)" 
          }}
        >
          {isSubmitting || isLoadingStatus ? (
            <Loader2 className="w-24 h-24 animate-spin opacity-80" />
          ) : (
            <Pointer className="w-24 h-24 opacity-90 drop-shadow-md animate-bounce transform -rotate-12" strokeWidth={1.5} />
          )}
          <div className="absolute inset-x-0 -bottom-10 text-center">
            <span className="text-sm font-bold text-slate-700 bg-white px-5 py-2 rounded-full shadow-md border border-slate-100 uppercase tracking-widest whitespace-nowrap">
              {isSubmitting || isLoadingStatus ? "MENYIAPKAN..." : isCheckout ? "TAP UNTUK PULANG" : "TAP UNTUK MASUK"}
            </span>
          </div>
        </button>

        <div className="mt-20">
          {!location ? (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-semibold border border-amber-200">
              <Loader2 className="h-4 w-4 animate-spin" /> Menunggu Lokasi GPS...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200 shadow-sm">
              <MapPin className="h-4 w-4" /> Akurasi Lokasi: ±{Math.round(location.accuracy)}m
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
