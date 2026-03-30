"use client"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut, Camera, User, Building2, Briefcase, Mail, Phone, Calendar, Edit3, X, MapPin, Lock } from "lucide-react"
import { getEmployeeProfile, updateMobileProfile } from "@/lib/actions/pegawai-detail"
import { changePasswordWithVerification } from "@/lib/actions/auth-actions"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"

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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") fetchData()
  }, [status])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const data = await res.json()
        if (data?.id) {
          const profile = await getEmployeeProfile(data.id)
          setPegawai(profile)
          if (profile) {
            setFormData({
              email: profile.email || "",
              telepon: profile.telepon || ""
            })
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pegawai) return
    setIsUploading(true)
    toast.loading("Mengupload foto...")
    try {
      const formData = new FormData()
      formData.append("pegawaiId", pegawai.id)
      formData.append("fotoFile", file)
      const res = await fetch("/api/pegawai/upload-foto", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPegawai((p: any) => ({ ...p, fotoUrl: json.url }))
      await update({ picture: json.url })
      toast.dismiss()
      toast.success("Foto diperbarui!")
    } catch (e: any) {
      toast.dismiss()
      toast.error(e.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pegawai) return
    setIsSaving(true)
    toast.loading("Menyimpan data...")
    try {
      const res = await updateMobileProfile(pegawai.id, formData)
      if (res.error) throw new Error(res.error)
      toast.dismiss()
      toast.success("Profil berhasil diperbarui!")
      setShowEditModal(false)
      fetchData() // reload terbaru
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.message)
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
    toast.loading("Mengganti password...")
    try {
      const res = await changePasswordWithVerification(passForm.current, passForm.newPass)
      if (res.error) throw new Error(res.error)
      
      toast.dismiss()
      toast.success("Password berhasil diubah!")
      setShowPasswordModal(false)
      setPassForm({ current: "", newPass: "", confirm: "" })
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const infoRows = [
    { icon: User, label: "NIK", value: pegawai?.nik },
    { icon: Briefcase, label: "Jabatan", value: pegawai?.jabatan },
    { icon: Building2, label: "Bidang", value: pegawai?.subBidang?.nama ? `${pegawai?.bidang?.nama} / ${pegawai?.subBidang?.nama}` : pegawai?.bidang?.nama },
    { icon: MapPin, label: "Tempat, Tanggal Lahir", value: (pegawai?.tempatLahir || pegawai?.tanggalLahir) ? `${pegawai?.tempatLahir || '-'}, ${pegawai?.tanggalLahir ? format(new Date(pegawai.tanggalLahir), "d MMMM yyyy", { locale: idLocale }) : '-'}` : "-" },
    { icon: Mail, label: "Email", value: pegawai?.email },
    { icon: Phone, label: "Telepon", value: pegawai?.telepon },
    { icon: Calendar, label: "Tgl Masuk", value: pegawai?.tanggalMasuk ? format(new Date(pegawai.tanggalMasuk), "d MMMM yyyy", { locale: idLocale }) : "-" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header dengan avatar */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0d0d12] px-5 pb-10 text-center" style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}>
        <div className="relative mx-auto mb-4 h-24 w-24">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white/30 bg-white/10">
            {pegawai?.fotoUrl ? (
              <img src={pegawai.fotoUrl} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                {pegawai?.nama?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary shadow-lg">
            <Camera className="h-4 w-4 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadFoto} disabled={isUploading} />
          </label>
        </div>
        <h1 className="text-xl font-bold text-white">{pegawai?.nama || session?.user?.name}</h1>
        <p className="mt-1 text-sm text-blue-200">
          {pegawai?.jabatan}
          {pegawai?.subBidang?.nama ? ` - ${pegawai.subBidang.nama}` : ""}
        </p>
        <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
          {pegawai?.status || "AKTIF"}
        </span>
      </div>

      {/* Info rows */}
      <div className="mx-4 -mt-5 rounded-2xl bg-card shadow-lg border border-border overflow-hidden">
        {infoRows.map((row, i) => (
          <div key={row.label} className={`flex items-center gap-3 px-4 py-3.5 ${i < infoRows.length - 1 ? "border-b border-border" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <row.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">{row.label}</p>
              <p className="text-sm font-medium truncate">{row.value || "-"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BPJS & Bank */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-[10px] text-muted-foreground mb-1">Bank</p>
          <p className="text-sm font-semibold">{pegawai?.bank || "-"}</p>
          <p className="text-xs text-muted-foreground">{pegawai?.noRekening || ""}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-[10px] text-muted-foreground mb-1">BPJS Kesehatan</p>
          <p className="text-sm font-semibold truncate">{pegawai?.bpjsKesehatan || "-"}</p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-3">
        <button
          onClick={() => setShowEditModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-white shadow-lg active:scale-95 transition-transform"
        >
          <Edit3 className="h-4 w-4" />
          Edit Data Profil
        </button>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-4 text-sm font-semibold text-white shadow-lg active:scale-95 transition-transform"
        >
          <Lock className="h-4 w-4" />
          Ganti Password
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4 mb-8">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full sm:h-auto sm:w-[500px] bg-card rounded-t-3xl sm:rounded-3xl p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Edit Kontak</h2>
              <button disabled={isSaving} onClick={() => setShowEditModal(false)} className="p-2 rounded-full bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Perubahan data resmi lainnya dilakukan melalui HRD/Admin.</p>

            <form onSubmit={handleSaveEdit} className="pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email" required
                  placeholder="email@contoh.com"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.telepon} onChange={e => setFormData(p => ({...p, telepon: e.target.value}))}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full h-[75vh] sm:h-auto sm:w-[500px] bg-card rounded-t-3xl sm:rounded-3xl p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Ganti Password</h2>
              <button disabled={isChangingPassword} onClick={() => setShowPasswordModal(false)} className="p-2 rounded-full bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePassword} className="flex-1 overflow-y-auto pr-2 pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Password Saat Ini</label>
                <input 
                  type="password" required
                  placeholder="Masukkan password yang sekarang"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={passForm.current} onChange={e => setPassForm(p => ({...p, current: e.target.value}))}
                />
              </div>

              <div className="space-y-1.5 mt-6 border-t border-border pt-4">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-primary">Password Baru</label>
                <input 
                  type="password" required minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={passForm.newPass} onChange={e => setPassForm(p => ({...p, newPass: e.target.value}))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-primary">Konfirmasi Password Baru</label>
                <input 
                  type="password" required minLength={8}
                  placeholder="Ketik ulang password baru Anda"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={passForm.confirm} onChange={e => setPassForm(p => ({...p, confirm: e.target.value}))}
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit" disabled={isChangingPassword}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Password Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
