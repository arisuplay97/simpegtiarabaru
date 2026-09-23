"use client"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut, Camera, User, Building2, Briefcase, Mail, Phone, Calendar, Edit3, X, MapPin, Lock, ArrowLeft, ChevronRight, Clock, Radio, ChevronDown, HelpCircle, Monitor } from "lucide-react"
import { getMobileProfile, updateMobileProfile } from "@/lib/actions/pegawai-detail"
import { changePasswordWithVerification } from "@/lib/actions/auth-actions"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

const faqList = [
  {
    question: 'Kenapa saya tidak bisa login dan muncul pesan "Akun Terhubung ke Perangkat Lain"?',
    answer:
      'Demi keamanan data kepegawaian dan mencegah kecurangan presensi (titip absen), SIMPEG TIARA menerapkan sistem 1 Akun 1 Device (Device Binding). Akun Anda secara otomatis terkunci pada smartphone pertama yang Anda gunakan untuk login.',
  },
  {
    question: 'Bagaimana jika HP saya hilang, rusak, atau saya baru saja ganti HP baru?',
    answer:
      'Anda tidak bisa langsung login di HP baru. Silakan hubungi Admin / HRD untuk melakukan Reset Device Binding akun Anda. Setelah di-reset oleh HRD, Anda dapat langsung login di perangkat baru Anda.',
  },
  {
    question: 'Bagaimana jika saya lupa kata sandi (password)?',
    answer:
      'Hubungi Administrator/HRD untuk melakukan reset password akun Anda. Setelah login, sangat disarankan untuk langsung mengganti kata sandi di menu profil.',
  },
  {
    question: 'Mengapa saat absen muncul pesan "Di Luar Radius Kantor"?',
    answer:
      'Presensi mewajibkan Anda berada di dalam radius area kantor yang telah ditentukan (Kantor Pusat maupun Kantor Cabang). Pastikan GPS/Lokasi di HP Anda sudah aktif.',
  },
  {
    question: 'Bagaimana jika saya berhalangan hadir karena sakit mendadak?',
    answer:
      'Segera pilih menu Pengajuan Cuti & Izin > pilih kategori Sakit > cantumkan keterangan serta unggah foto surat keterangan dokter (SKD) resmi.',
  },
  {
    question: 'Kenapa saya tidak menerima notifikasi pengumuman HRD di status bar HP?',
    answer:
      'Pastikan Anda telah mengaktifkan tombol lonceng notifikasi di aplikasi dan mengklik "Izinkan / Allow Notifications" pada pop-up browser. Di Android/iOS, pastikan juga izin notifikasi untuk peramban (Chrome/Safari) tidak diblokir di setelan sistem HP Anda.',
  },
  {
    question: 'Bagaimana cara memasang SIMPEG di layar depan HP seperti aplikasi Play Store?',
    answer:
      'Buka SIMPEG di Chrome (Android) > tekan menu titik tiga di kanan atas > pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama". Untuk pengguna iPhone (Safari), tekan tombol Share (ikon kotak panah ke atas) > pilih "Add to Home Screen".',
  },
]

export default function MobileProfil() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [pegawai, setPegawai] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passForm, setPassForm] = useState({ current: "", newPass: "", confirm: "" })
  const [formData, setFormData] = useState({
    email: "",
    telepon: ""
  })
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index))
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined" && !navigator.onLine) return
      router.push("/login")
    }
    if (status === "authenticated") fetchData()
  }, [status])

  const fetchData = async () => {
    try {
      const profile = await getMobileProfile()
      if (profile) {
        setPegawai(profile)
        setFormData({
          email: profile.email || "",
          telepon: profile.telepon || ""
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pegawai) return
    setIsUploading(true)
    const toastId = toast.loading("Mengunggah foto profil...")
    try {
      const formPayload = new FormData()
      formPayload.append("pegawaiId", pegawai.id)
      formPayload.append("fotoFile", file)
      const res = await fetch("/api/pegawai/upload-foto", { method: "POST", body: formPayload })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPegawai((p: any) => ({ ...p, fotoUrl: json.url }))
      await update({ picture: json.url })
      toast.success("Foto profil berhasil diperbarui!", { id: toastId })
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunggah foto", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pegawai) return
    setIsSaving(true)
    const toastId = toast.loading("Menyimpan kontak...")
    try {
      const res = await updateMobileProfile(pegawai.id, formData)
      if (res.error) throw new Error(res.error)
      toast.success("Kontak berhasil diperbarui!", { id: toastId })
      setShowEditModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPass !== passForm.confirm) {
      toast.error("Password baru dan konfirmasi tidak cocok!")
      return
    }
    if (passForm.newPass.length < 8) {
      toast.error("Password baru minimal 8 karakter!")
      return
    }

    setIsChangingPassword(true)
    const toastId = toast.loading("Mengubah password...")
    try {
      const res = await changePasswordWithVerification(passForm.current, passForm.newPass)
      if (res.error) throw new Error(res.error)
      toast.success("Password berhasil diubah!", { id: toastId })
      setShowPasswordModal(false)
      setPassForm({ current: "", newPass: "", confirm: "" })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
      </div>
    )
  }

  const infoRows = [
    { icon: User, label: "NIK", value: pegawai?.nik },
    { icon: Briefcase, label: "Jabatan", value: pegawai?.jabatan },
    { icon: Building2, label: "Bidang", value: pegawai?.subBidang?.nama ? `${pegawai?.bidang?.nama} · ${pegawai?.subBidang?.nama}` : pegawai?.bidang?.nama },
    { icon: MapPin, label: "Tempat, Tanggal Lahir", value: (pegawai?.tempatLahir || pegawai?.tanggalLahir) ? `${pegawai?.tempatLahir || '-'}, ${pegawai?.tanggalLahir ? format(new Date(pegawai.tanggalLahir), "d MMMM yyyy", { locale: idLocale }) : '-'}` : "-" },
    { icon: Mail, label: "Email", value: pegawai?.email },
    { icon: Phone, label: "Telepon / WhatsApp", value: pegawai?.telepon },
    { icon: Calendar, label: "Tanggal Masuk", value: pegawai?.tanggalMasuk ? format(new Date(pegawai.tanggalMasuk), "d MMMM yyyy", { locale: idLocale }) : "-" },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] font-sans pb-28">
      {/* Header dengan Avatar */}
      <div 
        className="bg-zinc-950 px-5 pb-8 text-center relative border-b border-zinc-850"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Profil Karyawan</span>
          <div className="w-8" />
        </div>

        <div className="relative mx-auto mb-3.5 h-20 w-20">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-900 shadow-md">
            {pegawai?.fotoUrl ? (
              <img src={pegawai.fotoUrl} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-300">
                {pegawai?.nama?.charAt(0) ?? "U"}
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white shadow-md active:scale-90 transition-all">
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadFoto} disabled={isUploading} />
          </label>
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight">{pegawai?.nama || session?.user?.name}</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          {pegawai?.jabatan || "Karyawan"}
        </p>
        <span className="mt-2 inline-block rounded-full bg-zinc-900 border border-zinc-800 px-3 py-0.5 text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">
          Status: {pegawai?.status || "AKTIF"}
        </span>
      </div>

      {/* Info rows */}
      <div className="mx-4 mt-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 overflow-hidden max-w-md mx-auto">
        <div className="p-3.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Informasi Data Diri
          </p>
        </div>
        {infoRows.map((row, i) => (
          <div key={row.label} className={cn("flex items-center gap-3 px-4 py-3", i < infoRows.length - 1 && "border-b border-zinc-100 dark:border-zinc-800")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              <row.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{row.label}</p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">{row.value || "-"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BPJS & Bank */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2.5 max-w-md mx-auto">
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Rekening Bank</p>
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{pegawai?.bank || "-"}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">{pegawai?.noRekening || "-"}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">BPJS Kesehatan</p>
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{pegawai?.bpjsKesehatan || "-"}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Terdaftar Aktif</p>
        </div>
      </div>

      {/* Pengaturan Khusus Admin / HRD */}
      {(() => {
        const userRole = (pegawai?.role || (session?.user as any)?.role || "").toUpperCase()
        const isHrdOrAdmin = ["SUPERADMIN", "ADMIN", "HRD", "DIREKSI"].includes(userRole) || 
                             (session?.user?.name || "").toLowerCase().includes("admin")
        if (!isHrdOrAdmin) return null

        return (
          <div className="px-4 mt-4 space-y-2 max-w-md mx-auto">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              Menu Administrator & HRD
            </p>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-1.5 shadow-2xs divide-y divide-zinc-100 dark:divide-zinc-800/80">
              <Link
                href="/m/settings/absensi"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pengaturan Jam Absensi</p>
                    <p className="text-[10px] text-zinc-500">Pusat, Cabang, & Khusus Sabtu</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
              </Link>

              <Link
                href="/m/settings/lokasi"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pengaturan Lokasi Absensi</p>
                    <p className="text-[10px] text-zinc-500">Geofencing radius & koordinat GPS</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
              </Link>

              <Link
                href="/m/radar"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Live Radar Kehadiran</p>
                    <p className="text-[10px] text-zinc-500">Monitoring absensi realtime seluruh pegawai</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
              </Link>
            </div>
          </div>
        )
      })()}

      {/* Pusat Bantuan & FAQ */}
      <div className="px-4 mt-4 space-y-2 max-w-md mx-auto">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Tanya Jawab & Bantuan (FAQ)
            </p>
          </div>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/40">
            {faqList.length} Tanya Jawab
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-2 shadow-2xs divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {faqList.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div key={i} className="p-1.5 first:pt-1 last:pb-1">
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-start justify-between gap-2.5 text-left p-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {faq.question}
                    </p>
                  </div>
                  <div className="p-0.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-300 ease-in-out",
                        isOpen && "rotate-180 text-blue-600 dark:text-blue-400"
                      )}
                    />
                  </div>
                </button>

                {/* Collapsible Answer with smooth height & opacity transition */}
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100 mt-1.5 mb-1"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-850/60 p-3 ml-7 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800/80">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-4 space-y-2.5 max-w-md mx-auto">
        <button
          onClick={() => setShowEditModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs active:scale-98 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-850"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit Kontak (Email & Telepon)
        </button>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white py-3 text-xs font-semibold text-white dark:text-zinc-900 shadow-2xs active:scale-98 transition-all"
        >
          <Lock className="h-3.5 w-3.5" />
          Ganti Kata Sandi
        </button>
        <button
          onClick={() => {
            document.cookie = "simpeg_view=desktop; path=/; max-age=604800; SameSite=Lax"
            window.location.href = "/dashboard?view=desktop"
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-2xs active:scale-98 transition-all hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
        >
          <Monitor className="h-3.5 w-3.5" />
          Buka Tampilan Desktop
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 mt-3 mb-6 max-w-md mx-auto">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400 active:scale-98 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar dari Aplikasi (Logout)
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ubah Data Kontak</h2>
              <button disabled={isSaving} onClick={() => setShowEditModal(false)} className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Perubahan data formal lainnya dapat diajukan ke HRD.</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Email
                </label>
                <input
                  type="email" required
                  placeholder="email@contoh.com"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={formData.telepon} onChange={e => setFormData(p => ({...p, telepon: e.target.value}))}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={isSaving}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 text-xs shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Simpan Perubahan Kontak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Ganti Kata Sandi
              </h2>
              <button disabled={isChangingPassword} onClick={() => setShowPasswordModal(false)} className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Kata Sandi Saat Ini</label>
                <input 
                  type="password" required
                  placeholder="Masukkan kata sandi lama"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={passForm.current} onChange={e => setPassForm(p => ({...p, current: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Kata Sandi Baru</label>
                <input 
                  type="password" required minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={passForm.newPass} onChange={e => setPassForm(p => ({...p, newPass: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Konfirmasi Kata Sandi Baru</label>
                <input 
                  type="password" required minLength={8}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={passForm.confirm} onChange={e => setPassForm(p => ({...p, confirm: e.target.value}))}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" disabled={isChangingPassword}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 text-xs shadow-xs"
                >
                  {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Perbarui Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
