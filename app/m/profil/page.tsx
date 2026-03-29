"use client"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut, Camera, User, Building2, Briefcase, Mail, Phone, Calendar } from "lucide-react"
import { getEmployeeProfile } from "@/lib/actions/pegawai-detail"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"

export default function MobileProfil() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [pegawai, setPegawai] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const infoRows = [
    { icon: User, label: "NIK", value: pegawai?.nik },
    { icon: Briefcase, label: "Jabatan", value: pegawai?.jabatan },
    { icon: Building2, label: "Bidang", value: pegawai?.subBidang?.nama ? `${pegawai?.bidang?.nama} / ${pegawai?.subBidang?.nama}` : pegawai?.bidang?.nama },
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

      {/* Logout */}
      <div className="px-4 mt-6 mb-8">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
