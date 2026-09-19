"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, MapPin, Plus, Edit2, Trash2,
  Navigation, CheckCircle2, X, Loader2,
  Building2, ShieldCheck, Crosshair, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getLokasiList, createLokasi, updateLokasi,
  deleteLokasi, toggleLokasiAktif
} from "@/lib/actions/lokasi"

interface LokasiItem {
  id: string
  nama: string
  tipe: string
  alamat: string
  latitude: number
  longitude: number
  radius: number
  aktif: boolean
  titikKoordinat?: any
}

export default function MobileSettingsLokasi() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [lokasiList, setLokasiList] = useState<LokasiItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGettingGps, setIsGettingGps] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nama: "",
    tipe: "kantor_cabang",
    alamat: "",
    latitude: "",
    longitude: "",
    radius: "100",
    aktif: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      const role = ((session?.user as any)?.role || "").toUpperCase()
      const isAllowed = ["SUPERADMIN", "ADMIN", "HRD", "DIREKSI"].includes(role) ||
                        (session?.user?.name || "").toLowerCase().includes("admin")
      if (!isAllowed) {
        toast.error("Hanya Admin atau HRD yang dapat mengakses pengaturan lokasi")
        router.push("/m/dashboard")
      } else {
        loadData()
      }
    }
  }, [status, session])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const list = await getLokasiList()
      setLokasiList(list as any[])
    } catch {
      toast.error("Gagal memuat daftar lokasi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      nama: "",
      tipe: "kantor_cabang",
      alamat: "",
      latitude: "",
      longitude: "",
      radius: "100",
      aktif: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: LokasiItem) => {
    setEditingId(item.id)
    setFormData({
      nama: item.nama,
      tipe: item.tipe,
      alamat: item.alamat,
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      radius: String(item.radius || 100),
      aktif: item.aktif,
    })
    setShowModal(true)
  }

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation tidak didukung pada browser ini")
      return
    }

    setIsGettingGps(true)
    const toastId = toast.loading("Mendeteksi koordinat GPS perangkat...")

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false)
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }))
        toast.success(`GPS Terkunci: ${lat}, ${lng} (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`, { id: toastId })
      },
      (err) => {
        setIsGettingGps(false)
        toast.error(`Gagal membaca GPS: ${err.message}`, { id: toastId })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleToggleAktif = async (item: LokasiItem) => {
    const nextStatus = !item.aktif
    setLokasiList((prev) =>
      prev.map((l) => (l.id === item.id ? { ...l, aktif: nextStatus } : l))
    )

    try {
      await toggleLokasiAktif(item.id, nextStatus)
      toast.success(`${item.nama} ${nextStatus ? "diaktifkan" : "dinonaktifkan"}`)
    } catch {
      toast.error("Gagal mengubah status lokasi")
      loadData()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama.trim() || !formData.latitude || !formData.longitude) {
      toast.error("Nama lokasi, latitude, dan longitude wajib diisi")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(editingId ? "Menyimpan perubahan lokasi..." : "Menambahkan lokasi...")

    try {
      const payload = {
        nama: formData.nama,
        tipe: formData.tipe,
        alamat: formData.alamat || "",
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius) || 100,
        aktif: formData.aktif,
      }

      if (editingId) {
        await updateLokasi(editingId, payload)
        toast.success("Lokasi berhasil diperbarui!", { id: toastId })
      } else {
        await createLokasi(payload)
        toast.success("Lokasi baru berhasil ditambahkan!", { id: toastId })
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan lokasi", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Menghapus lokasi...")
    try {
      await deleteLokasi(id)
      toast.success("Lokasi berhasil dihapus", { id: toastId })
      setDeleteConfirmId(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus lokasi", { id: toastId })
    }
  }

  const getTipeBadge = (tipe: string) => {
    if (tipe === "kantor_pusat") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
          Kantor Pusat
        </span>
      )
    }
    if (tipe === "kantor_cabang") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          Kantor Cabang
        </span>
      )
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
        Acara / Event
      </span>
    )
  }

  return (
    <div className="min-h-screen pb-28 font-sans bg-zinc-50 dark:bg-[#09090b]">
      {/* Top Bar */}
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
              Lokasi Absensi
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {lokasiList.length} titik geofencing aktif
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xs active:scale-95 transition-transform"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-xs text-zinc-500">Memuat titik geofencing...</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3 max-w-md mx-auto">
          {lokasiList.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 text-center border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Belum Ada Lokasi</p>
                <p className="text-xs text-zinc-500 mt-1">Tambahkan titik kantor pusat atau cabang untuk membatasi radius presensi.</p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Lokasi Pertama
              </button>
            </div>
          ) : (
            lokasiList.map((loc) => (
              <div
                key={loc.id}
                className={cn(
                  "rounded-2xl p-4 bg-white dark:bg-zinc-900 border transition-all duration-150 shadow-2xs space-y-3",
                  loc.aktif
                    ? "border-zinc-200/80 dark:border-zinc-800"
                    : "border-zinc-200/40 dark:border-zinc-800/40 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      loc.tipe === "kantor_cabang"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : loc.tipe === "kantor_pusat"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}>
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{loc.nama}</p>
                        {getTipeBadge(loc.tipe)}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {loc.alamat || "Alamat belum diatur"}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Switch */}
                  <button
                    onClick={() => handleToggleAktif(loc)}
                    className={cn(
                      "h-6 w-11 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 active:scale-95",
                      loc.aktif ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                  >
                    <span
                      className={cn(
                        "h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-150",
                        loc.aktif ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Geo Coordinates & Radius Info */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-2 border border-zinc-200/50 dark:border-zinc-700/50">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Koordinat GPS</p>
                    <p className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold truncate mt-0.5">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-2 border border-zinc-200/50 dark:border-zinc-700/50">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Radius Absen</p>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {loc.radius || 100} meter
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400">
                    {loc.aktif ? "Status: Aktif" : "Status: Nonaktif"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(loc)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold active:scale-95 transition-transform"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(loc.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[11px] font-semibold active:scale-95 transition-transform"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT LOKASI */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {editingId ? "Edit Lokasi Absensi" : "Tambah Lokasi Absensi"}
              </h2>
              <button
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Konfigurasi geofencing untuk mendeteksi radius presensi pegawai.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nama Lokasi / Kantor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantor Cabang Selong"
                  value={formData.nama}
                  onChange={(e) => setFormData((p) => ({ ...p, nama: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tipe Lokasi
                </label>
                <select
                  value={formData.tipe}
                  onChange={(e) => setFormData((p) => ({ ...p, tipe: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="kantor_cabang">Kantor Cabang</option>
                  <option value="kantor_pusat">Kantor Pusat</option>
                  <option value="acara">Acara / Event Khusus</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Jl. Raya Cabang No..."
                  value={formData.alamat}
                  onChange={(e) => setFormData((p) => ({ ...p, alamat: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              {/* Quick GPS Button */}
              <button
                type="button"
                onClick={handleGetCurrentGps}
                disabled={isGettingGps}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 py-2.5 text-xs font-bold text-blue-700 dark:text-blue-300 active:scale-98 transition-all"
              >
                {isGettingGps ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5 text-blue-600" />
                )}
                <span>Gunakan Koordinat GPS HP Saat Ini</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="-8.650000"
                    value={formData.latitude}
                    onChange={(e) => setFormData((p) => ({ ...p, latitude: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="116.500000"
                    value={formData.longitude}
                    onChange={(e) => setFormData((p) => ({ ...p, longitude: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Radius Geofencing (Meter)
                </label>
                <input
                  type="number"
                  min="20"
                  max="2000"
                  required
                  value={formData.radius}
                  onChange={(e) => setFormData((p) => ({ ...p, radius: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Default 100 meter dari titik koordinat pusat.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 text-xs shadow-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Simpan Perubahan Lokasi"
                  ) : (
                    "Tambahkan Lokasi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Hapus Lokasi Ini?</p>
                <p className="text-xs text-zinc-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 active:scale-98"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold active:scale-98"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
