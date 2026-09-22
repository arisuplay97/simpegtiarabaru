"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Clock, Building2, CalendarDays,
  Save, Loader2, ShieldCheck, CheckCircle2,
  Info, Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getPengaturan, updatePengaturan } from "@/lib/actions/pengaturan"

export default function MobileSettingsAbsensi() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"pusat" | "cabang" | "sabtu">("pusat")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<any>({
    // Pusat (Senin - Jumat)
    jamMasuk: "08:00",
    jamPulang: "17:00",
    jamSiangPusat: "12:00",
    mulaiAbsenMasuk: "06:30",
    batasAbsenMasuk: "14:00",
    mulaiAbsenSiang: "11:30",
    batasAbsenSiang: "13:30",
    mulaiAbsenPulang: "15:00",
    batasAbsenPulang: "18:00",
    batasTerlambat: 15,
    dendaTidakAbsenSiang: 10000,

    // Cabang (Senin - Jumat)
    jamMasukCabang: "08:00",
    jamPulangCabang: "16:30",
    mulaiAbsenMasukCabang: "06:30",
    batasAbsenMasukCabang: "14:00",
    mulaiAbsenPulangCabang: "15:00",
    batasAbsenPulangCabang: "18:00",

    // Khusus Hari Sabtu (Cabang)
    aktifSabtuCabang: true,
    jamMasukSabtuCabang: "08:00",
    jamPulangSabtuCabang: "13:00",
    mulaiMasukSabtuCabang: "06:30",
    batasMasukSabtuCabang: "11:00",
    mulaiPulangSabtuCabang: "12:00",
    batasPulangSabtuCabang: "15:00",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      const role = ((session?.user as any)?.role || "").toUpperCase()
      const isAllowed = ["SUPERADMIN", "ADMIN", "HRD", "DIREKSI"].includes(role) ||
                        (session?.user?.name || "").toLowerCase().includes("admin")
      if (!isAllowed) {
        toast.error("Hanya Admin atau HRD yang dapat mengakses pengaturan ini")
        router.push("/m/dashboard")
      } else {
        loadData()
      }
    }
  }, [status, session])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await getPengaturan()
      if (res.data) {
        setFormData((prev: any) => ({
          ...prev,
          ...res.data,
        }))
      }
    } catch {
      toast.error("Gagal memuat pengaturan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const toastId = toast.loading("Menyimpan jadwal absensi...")

    try {
      const payload = {
        ...formData,
        batasTerlambat: parseInt(formData.batasTerlambat) || 15,
        dendaTidakAbsenSiang: parseInt(formData.dendaTidakAbsenSiang) || 0,
      }

      const res = await updatePengaturan(payload)
      if (res.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success("Pengaturan absensi berhasil disimpan!", { id: toastId })
        if (res.data) {
          setFormData((prev: any) => ({ ...prev, ...res.data }))
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan pengaturan", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-28 font-sans bg-zinc-50 dark:bg-[#09090b]">
      {/* Header Bar */}
      <div 
        className="sticky top-0 z-40 px-4 py-3.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/m/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Pengaturan Absensi
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Waktu operasional & toleransi
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" /> HRD / Admin
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-xs text-zinc-500">Memuat konfigurasi absensi...</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
          {/* Segmented Control / Tabs */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/80 gap-1 text-xs">
            <button
              onClick={() => setActiveTab("pusat")}
              className={cn(
                "py-2 px-1 text-center font-semibold rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5",
                activeTab === "pusat"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Kantor Pusat</span>
            </button>
            <button
              onClick={() => setActiveTab("cabang")}
              className={cn(
                "py-2 px-1 text-center font-semibold rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5",
                activeTab === "cabang"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              )}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Cabang (Sen-Jum)</span>
            </button>
            <button
              onClick={() => setActiveTab("sabtu")}
              className={cn(
                "py-2 px-1 text-center font-semibold rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5 relative",
                activeTab === "sabtu"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
              <span>Khusus Sabtu</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>
          </div>

          {/* TAB 1: KANTOR PUSAT */}
          {activeTab === "pusat" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Jadwal Kantor Pusat (5 Hari Kerja)</p>
                  <p className="text-blue-800 dark:text-blue-300 mt-0.5">
                    Berlaku hari Senin s.d. Jumat. Hari Sabtu dan Minggu otomatis libur.
                  </p>
                </div>
              </div>

              {/* Jam Masuk & Pulang */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Jam Kerja Pokok</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Masuk
                    </label>
                    <input
                      type="time"
                      value={formData.jamMasuk || "08:00"}
                      onChange={(e) => handleChange("jamMasuk", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Pulang
                    </label>
                    <input
                      type="time"
                      value={formData.jamPulang || "17:00"}
                      onChange={(e) => handleChange("jamPulang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Toleransi Keterlambatan (Menit)
                  </label>
                  <input
                    type="number"
                    value={formData.batasTerlambat ?? 15}
                    onChange={(e) => handleChange("batasTerlambat", e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Status TERLAMBAT dihitung setelah lewat menit ini.</p>
                </div>
              </div>

              {/* Window Checkin & Checkout */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Jendela Waktu Presensi</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Check-in
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiAbsenMasuk || "06:30"}
                      onChange={(e) => handleChange("mulaiAbsenMasuk", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Batas Check-in
                    </label>
                    <input
                      type="time"
                      value={formData.batasAbsenMasuk || "14:00"}
                      onChange={(e) => handleChange("batasAbsenMasuk", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Check-out
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiAbsenPulang || "15:00"}
                      onChange={(e) => handleChange("mulaiAbsenPulang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Tutup Check-out
                    </label>
                    <input
                      type="time"
                      value={formData.batasAbsenPulang || "18:00"}
                      onChange={(e) => handleChange("batasAbsenPulang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Sesi Siang Kantor Pusat (3x Absen) */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-amber-200/80 dark:border-amber-900/50 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Sesi Absensi Siang (Khusus Pusat)
                  </p>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                    Sesi Siang
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Siang / Istirahat
                    </label>
                    <input
                      type="time"
                      value={formData.jamSiangPusat || "12:00"}
                      onChange={(e) => handleChange("jamSiangPusat", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Denda Tdk Absen Siang
                    </label>
                    <input
                      type="number"
                      value={formData.dendaTidakAbsenSiang ?? 10000}
                      onChange={(e) => handleChange("dendaTidakAbsenSiang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Absen Siang
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiAbsenSiang || "11:30"}
                      onChange={(e) => handleChange("mulaiAbsenSiang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Batas Absen Siang
                    </label>
                    <input
                      type="time"
                      value={formData.batasAbsenSiang || "13:30"}
                      onChange={(e) => handleChange("batasAbsenSiang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic">
                  Pegawai kantor pusat yang tidak absen siang akan dikenai potongan denda pada penggajian.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: KANTOR CABANG (WEEKDAY) */}
          {activeTab === "cabang" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Jadwal Kantor Cabang (Senin - Jumat)</p>
                  <p className="text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Khusus pekerja di kantor cabang untuk hari kerja reguler Senin sampai Jumat.
                  </p>
                </div>
              </div>

              {/* Jam Masuk & Pulang Cabang */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Jam Kerja Weekday Cabang</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Masuk Cabang
                    </label>
                    <input
                      type="time"
                      value={formData.jamMasukCabang || "08:00"}
                      onChange={(e) => handleChange("jamMasukCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Pulang Cabang
                    </label>
                    <input
                      type="time"
                      value={formData.jamPulangCabang || "16:30"}
                      onChange={(e) => handleChange("jamPulangCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Window Checkin & Checkout Cabang */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Jendela Waktu Presensi Cabang</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Check-in Cabang
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiAbsenMasukCabang || "06:30"}
                      onChange={(e) => handleChange("mulaiAbsenMasukCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Batas Check-in Cabang
                    </label>
                    <input
                      type="time"
                      value={formData.batasAbsenMasukCabang || "14:00"}
                      onChange={(e) => handleChange("batasAbsenMasukCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Check-out Cabang
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiAbsenPulangCabang || "15:00"}
                      onChange={(e) => handleChange("mulaiAbsenPulangCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Tutup Check-out Cabang
                    </label>
                    <input
                      type="time"
                      value={formData.batasAbsenPulangCabang || "18:00"}
                      onChange={(e) => handleChange("batasAbsenPulangCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KHUSUS HARI SABTU (CABANG) */}
          {activeTab === "sabtu" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/25 text-amber-950 dark:text-amber-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-bold">Fitur Khusus: Presensi Hari Sabtu</p>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Semua pekerja kantor cabang bekerja <strong>Senin s.d. Sabtu (6 hari kerja)</strong>. Di hari Sabtu, jam operasional berakhir lebih awal dan check-in hanya diizinkan untuk pegawai kantor cabang.
                </p>
              </div>

              {/* Jam Masuk & Pulang Sabtu */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Jam Operasional Sabtu Cabang
                  </p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    Setengah Hari
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Masuk Sabtu
                    </label>
                    <input
                      type="time"
                      value={formData.jamMasukSabtuCabang || "08:00"}
                      onChange={(e) => handleChange("jamMasukSabtuCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Jam Pulang Sabtu
                    </label>
                    <input
                      type="time"
                      value={formData.jamPulangSabtuCabang || "13:00"}
                      onChange={(e) => handleChange("jamPulangSabtuCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Window Checkin & Checkout Sabtu */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Jendela Presensi Hari Sabtu</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Check-in Sabtu
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiMasukSabtuCabang || "06:30"}
                      onChange={(e) => handleChange("mulaiMasukSabtuCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                    <p className="text-[9px] text-zinc-400 mt-1">Sesi pagi mulai</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Batas Check-in Sabtu
                    </label>
                    <input
                      type="time"
                      value={formData.batasMasukSabtuCabang || "11:00"}
                      onChange={(e) => handleChange("batasMasukSabtuCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                    <p className="text-[9px] text-zinc-400 mt-1">Batas akhir masuk</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Buka Check-out Sabtu
                    </label>
                    <input
                      type="time"
                      value={formData.mulaiPulangSabtuCabang || "12:00"}
                      onChange={(e) => handleChange("mulaiPulangSabtuCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                    <p className="text-[9px] text-zinc-400 mt-1">Bisa pulang mulai</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Tutup Check-out Sabtu
                    </label>
                    <input
                      type="time"
                      value={formData.batasPulangSabtuCabang || "15:00"}
                      onChange={(e) => handleChange("batasPulangSabtuCabang", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                    <p className="text-[9px] text-zinc-400 mt-1">Sesi tutup total</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Save Button */}
          <div className="pt-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3.5 px-4 text-xs font-bold shadow-lg shadow-zinc-900/10 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Konfigurasi...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan Jadwal</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
