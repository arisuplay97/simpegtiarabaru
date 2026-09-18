"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Loader2, UserCircle } from "lucide-react"
import { getEmployeeProfile } from "@/lib/actions/pegawai-detail"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getDokumenPegawai } from "@/lib/actions/dokumen"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  User, Building2, Briefcase, Calendar, Mail, Phone,
  GraduationCap, CreditCard, Shield, Clock, Target,
  FileText, BookOpen, History, Users, TrendingUp,
  CheckCircle2, AlertCircle, Camera, Download, ExternalLink,
  Sparkles
} from "lucide-react"

const statusConfig: Record<string, { label: string; dot: string; className: string }> = {
  AKTIF: { 
    label: "Aktif", 
    dot: "bg-emerald-500 ring-2 ring-emerald-500/20", 
    className: "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600/50 font-semibold shadow-xs" 
  },
  CUTI: { 
    label: "Cuti", 
    dot: "bg-amber-500 ring-2 ring-amber-500/20", 
    className: "border-amber-500/40 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600/50 font-semibold shadow-xs" 
  },
  NON_AKTIF: { 
    label: "Non-Aktif", 
    dot: "bg-slate-400 ring-2 ring-slate-400/20", 
    className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold shadow-xs" 
  },
  PENSIUN: { 
    label: "Pensiun", 
    dot: "bg-rose-500 ring-2 ring-rose-500/20", 
    className: "border-rose-500/40 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600/50 font-semibold shadow-xs" 
  },
}

const spConfig: Record<string, { label: string; className: string }> = {
  SP1: { 
    label: "SP-1", 
    className: "border-amber-400/80 bg-amber-50 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-600/80 font-bold shadow-xs" 
  },
  SP2: { 
    label: "SP-2", 
    className: "border-orange-400/80 bg-orange-50 text-orange-950 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-600/80 font-bold shadow-xs" 
  },
  SP3: { 
    label: "SP-3", 
    className: "border-rose-400/80 bg-rose-50 text-rose-950 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-600/80 font-bold shadow-xs" 
  },
}

export default function ProfilBasePage() {
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [employee, setEmployee] = useState<any>(null)
  const [attendanceSummary, setAttendanceSummary] = useState<any>({
    hadir: 0,
    izin: 0,
    sakit: 0,
    cuti: 0,
    alpha: 0,
    terlambat: 0,
  })
  const [dokumenList, setDokumenList] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("profil")

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      setError("Anda belum login ke sistem.")
      setLoading(false)
      return
    }
    fetchMyProfil()
  }, [session, status])

  const fetchMyProfil = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const data = await res.json()
        if (data?.id) {
          const profile = await getEmployeeProfile(data.id)
          if (profile) {
            setEmployee(profile)
            getEmployeeAttendanceSummary(profile.id).then(setAttendanceSummary).catch(() => {})
            getDokumenPegawai(profile.id).then(r => { if (r.data) setDokumenList(r.data) }).catch(() => {})
          } else {
            setError("Data profil tidak ditemukan.")
          }
        } else {
          setError("Profil pegawai Anda belum terdaftar.")
        }
      } else {
        setError("Profil pegawai Anda belum terdaftar.")
      }
    } catch {
      setError("Gagal memuat data profil.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employee) return
    setIsUploading(true)
    toast.loading("Mengunggah foto profil...")
    try {
      const formData = new FormData()
      formData.append("pegawaiId", employee.id)
      formData.append("fotoFile", file)
      const res = await fetch("/api/pegawai/upload-foto", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal upload")
      setEmployee((prev: any) => ({ ...prev, fotoUrl: json.url }))
      await update({ picture: json.url })
      toast.dismiss()
      toast.success("Foto profil berhasil diperbarui")
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.message || "Gagal mengunggah foto")
    } finally {
      setIsUploading(false)
    }
  }

  const getPensiunInfo = () => {
    if (!employee) return null
    if (!employee.tanggalLahir) {
      return {
        label: "Masa Pensiun",
        targetYear: null,
        sisaText: "Perlu Tgl Lahir",
        tanggal: "—",
        percentage: 0,
        yearsLeft: 0,
        daysLeft: 0,
        totalDays: 0,
      }
    }
    const birthDate = new Date(employee.tanggalLahir)
    if (isNaN(birthDate.getTime())) {
      return {
        label: "Masa Pensiun",
        targetYear: null,
        sisaText: "Tgl Lahir Tidak Valid",
        tanggal: "—",
        percentage: 0,
        yearsLeft: 0,
        daysLeft: 0,
        totalDays: 0,
      }
    }
    const pensiunDate = new Date(birthDate.getFullYear() + 56, birthDate.getMonth(), birthDate.getDate())
    const today = new Date()
    
    const diffTime = pensiunDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let percentage = 0
    if (employee.tanggalMasuk) {
      const joinDate = new Date(employee.tanggalMasuk)
      if (!isNaN(joinDate.getTime())) {
        const totalDuration = pensiunDate.getTime() - joinDate.getTime()
        const elapsedDuration = today.getTime() - joinDate.getTime()
        if (totalDuration > 0) {
          percentage = Math.max(0, Math.min(100, Math.round((elapsedDuration / totalDuration) * 100)))
        }
      }
    }

    if (diffDays <= 0) {
      return { 
        status: "Purna Tugas", 
        sisaText: "Purna Tugas",
        percentage: 100, 
        label: "Masa Pensiun", 
        targetYear: pensiunDate.getFullYear(), 
        tanggal: format(pensiunDate, "dd MMM yyyy", { locale: idLocale }),
        yearsLeft: 0,
        daysLeft: 0,
        totalDays: 0
      }
    }
    
    const years = Math.floor(diffDays / 365)
    const days = diffDays % 365
    const sisaText = years > 0 ? `${years} Tahun ${days} Hari` : `${diffDays} Hari`
    
    return { 
      tanggal: format(pensiunDate, "dd MMM yyyy", { locale: idLocale }),
      sisaText,
      percentage,
      label: "Masa Pensiun",
      targetYear: pensiunDate.getFullYear(),
      yearsLeft: years,
      daysLeft: days,
      totalDays: diffDays
    }
  }

  const pensiunInfo = getPensiunInfo()
  const statusKey = (employee?.status || "AKTIF").toUpperCase()
  const statusInfo = statusConfig[statusKey] || statusConfig.AKTIF

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background text-slate-900 dark:text-zinc-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kepegawaian", "Profil Saya"]} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="mx-auto max-w-6xl space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">Memuat profil pegawai...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <UserCircle className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-zinc-100">Akses Profil</h1>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1">{error}</p>
                </div>
              </div>
            ) : employee ? (
              <>
                {/* Executive Profile Showcase Grid (Hero + Animated Masa Pensiun) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Main Profile Hero Card (8 cols) */}
                  <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {/* Avatar with Status Ring */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="relative group">
                          <Avatar className="h-28 w-28 rounded-2xl border-2 border-slate-200/90 dark:border-zinc-700 shadow-sm object-cover">
                            {employee.fotoUrl ? (
                              <AvatarImage src={employee.fotoUrl} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="rounded-2xl bg-slate-100 dark:bg-zinc-800 text-3xl font-bold text-slate-700 dark:text-zinc-200">
                              {(employee.nama || "P").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#111113] shadow-xs" />
                          </span>
                          <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-medium">
                            <Camera className="h-4 w-4 mb-0.5" />
                            Ubah Foto
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                          </label>
                        </div>
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                          <span className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium">
                            <Camera className="h-3 w-3" /> Ganti Foto
                          </span>
                        </label>
                      </div>

                      {/* Main Info */}
                      <div className="text-center sm:text-left space-y-2.5 flex-1 min-w-0">
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
                              {employee.nama}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${statusInfo.className}`}>
                              <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                              {statusInfo.label}
                            </span>
                            {employee.sp && spConfig[employee.sp as keyof typeof spConfig] && (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${spConfig[employee.sp as keyof typeof spConfig].className}`}>
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {spConfig[employee.sp as keyof typeof spConfig].label}
                              </span>
                            )}
                          </div>
                          {(() => {
                            const jabatan = employee.jabatan || "Pegawai"
                            const subBidang = employee.subBidang?.nama?.trim()
                            const bidang = employee.bidang?.nama?.trim() || "Kantor Pusat"

                            let displayJabatan = jabatan
                            if (subBidang && !jabatan.toLowerCase().includes(subBidang.toLowerCase())) {
                              displayJabatan = `${jabatan} ${subBidang}`
                            }

                            return (
                              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mt-1">
                                {displayJabatan} <span className="text-slate-400 dark:text-zinc-500 font-normal">di</span> {bidang}
                              </p>
                            )
                          })()}
                        </div>

                        {/* Badges / Pill row */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                            NIK: {employee.nik}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                            <User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                            {employee.tipePegawai || "TETAP"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 font-mono text-slate-700 dark:text-zinc-300">
                            Gol. {employee.golongan || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300" suppressHydrationWarning>
                            <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                            TMT {employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd/MM/yyyy") : "—"}
                          </span>
                        </div>

                        {/* Contact Chips */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                          {employee.email && (
                            <a
                              href={`mailto:${employee.email}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                              <span>{employee.email}</span>
                            </a>
                          )}
                          {employee.telepon && (
                            <a
                              href={`tel:${employee.telepon}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors font-mono"
                            >
                              <Phone className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                              <span>{employee.telepon}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick 4 Metrics Grid */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/70">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pendidikan Terakhir</span>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {employee.pendidikanTerakhir || <span className="text-slate-400 dark:text-zinc-600 font-normal italic text-[11px]">Belum diisi</span>}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/70">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Rekening Bank</span>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {employee.bank ? `${employee.bank} - ${employee.noRekening || ""}` : <span className="text-slate-400 dark:text-zinc-600 font-normal italic text-[11px]">Belum terdaftar</span>}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/70">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">BPJS Kesehatan</span>
                        <p className="mt-1 font-semibold font-mono text-slate-800 dark:text-zinc-200 truncate">
                          {employee.bpjsKesehatan || <span className="text-slate-400 dark:text-zinc-600 font-normal italic text-[11px]">Belum diverifikasi</span>}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/70">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Atasan Langsung</span>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {employee.atasanLangsung || <span className="text-slate-400 dark:text-zinc-600 font-normal italic text-[11px]">Belum ditentukan</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Modern Minimalist Masa Pensiun Card (4 cols) */}
                  <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-5 shadow-xs flex flex-col justify-between">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            {pensiunInfo?.label || "Masa Pensiun"}
                          </span>
                        </div>
                        {pensiunInfo?.targetYear ? (
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/60">
                            Target {pensiunInfo.targetYear}
                          </span>
                        ) : null}
                      </div>

                      {/* Sisa Pengabdian */}
                      <div className="mt-4">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Sisa Waktu Pengabdian</p>
                        <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">
                          {pensiunInfo?.sisaText || "—"}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-zinc-400">Perjalanan Karir</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
                            {Math.round(pensiunInfo?.percentage || 0)}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-900 dark:bg-zinc-200 transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, pensiunInfo?.percentage || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Milestones Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">TMT Mulai</span>
                          <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                            {employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd MMM yyyy", { locale: idLocale }) : "—"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Purna Tugas</span>
                          <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                            {pensiunInfo?.tanggal || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Fase Pengabdian Aktif
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500 font-mono text-[10px]">
                          Batas Usia: 56 Th
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ringkasan Presensi Bulan Ini (6 Minimalist SaaS Boxes) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Rekap Presensi Bulan Ini
                    </h2>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Sinkronisasi otomatis
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: "Hadir", value: attendanceSummary.hadir || 0, dot: "bg-emerald-500" },
                      { label: "Izin", value: attendanceSummary.izin || 0, dot: "bg-blue-500" },
                      { label: "Sakit", value: attendanceSummary.sakit || 0, dot: "bg-sky-500" },
                      { label: "Cuti", value: attendanceSummary.cuti || 0, dot: "bg-purple-500" },
                      { label: "Terlambat", value: attendanceSummary.terlambat || 0, dot: "bg-amber-500" },
                      { label: "Alpha", value: attendanceSummary.alpha || 0, dot: "bg-rose-500" },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-3 text-center shadow-xs"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </div>
                        <div className="mt-1 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">
                          {s.value}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">Hari</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <TabsTrigger
                      value="profil"
                      className="rounded-xl text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs gap-1.5 py-2 px-3.5"
                    >
                      <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Data Lengkap Pegawai
                    </TabsTrigger>
                    <TabsTrigger
                      value="dokumen"
                      className="rounded-xl text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs gap-1.5 py-2 px-3.5"
                    >
                      <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Dokumen Pegawai ({dokumenList.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Content: Profil Data */}
                  <TabsContent value="profil" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Card Data Pribadi */}
                      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300">
                              <User className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Identitas Pribadi</h3>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Data kependudukan terverifikasi</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700">
                            Dukcapil
                          </Badge>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                          {[
                            { label: "Nomor Induk Karyawan (NIK)", value: employee.nik, mono: true },
                            { label: "Jenis Kelamin", value: employee.jenisKelamin === "L" ? "Laki-laki" : employee.jenisKelamin === "P" ? "Perempuan" : null },
                            { label: "Tempat, Tanggal Lahir", value: `${employee.tempatLahir || "—"}, ${employee.tanggalLahir ? format(new Date(employee.tanggalLahir), "dd MMMM yyyy", { locale: idLocale }) : "—"}` },
                            { label: "Agama", value: employee.agama },
                            { label: "Status Pernikahan", value: employee.statusNikah },
                            { label: "Alamat Domisili", value: employee.alamat },
                          ].map(row => (
                            <div key={row.label} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                              <span className="text-slate-500 dark:text-zinc-400 shrink-0 text-xs font-medium">{row.label}</span>
                              <span className={`text-right text-slate-900 dark:text-zinc-100 font-medium ${row.mono ? "font-mono" : ""}`}>
                                {row.value || <span className="text-slate-400 dark:text-zinc-600 italic font-normal">Belum dilengkapi</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Data Kepegawaian & Finansial */}
                      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300">
                              <Briefcase className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Kepegawaian & Finansial</h3>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Informasi jabatan struktural dan jaminan</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                            SDM Aktif
                          </Badge>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                          {[
                            { label: "Jabatan Struktural", value: employee.jabatan },
                            { label: "Unit Kerja / Bidang", value: employee.bidang?.nama },
                            { label: "Golongan & Pangkat", value: `${employee.golongan || "—"} / ${employee.pangkat || "—"}` },
                            { label: "NPWP", value: employee.npwp, mono: true },
                            { label: "BPJS Ketenagakerjaan", value: employee.bpjsKetenagakerjaan, mono: true },
                            { label: "Bank & Nomor Rekening", value: employee.bank ? `${employee.bank} - ${employee.noRekening || "—"}` : null },
                          ].map(row => (
                            <div key={row.label} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                              <span className="text-slate-500 dark:text-zinc-400 shrink-0 text-xs font-medium">{row.label}</span>
                              <span className={`text-right text-slate-900 dark:text-zinc-100 font-medium ${row.mono ? "font-mono" : ""}`}>
                                {row.value || <span className="text-slate-400 dark:text-zinc-600 italic font-normal">Belum diset</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Content: Dokumen */}
                  <TabsContent value="dokumen">
                    <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            Berkas & Dokumen Pegawai
                          </h3>
                        </div>
                      </div>

                      {dokumenList.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                          <FileText className="h-8 w-8 text-slate-300 dark:text-zinc-700 mx-auto" strokeWidth={1.5} />
                          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">Belum ada dokumen yang diunggah</p>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Hubungi bagian HRD untuk kelengkapan berkas arsip Anda</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                          {dokumenList.map((d: any) => (
                            <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0">
                                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                    {d.namaDokumen}
                                  </p>
                                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                                    {d.jenisDokumen} · {d.tanggalUpload ? format(new Date(d.tanggalUpload), "dd MMM yyyy", { locale: idLocale }) : ""}
                                  </p>
                                </div>
                              </div>

                              {d.fileUrl && (
                                <a
                                  href={d.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium transition-colors shrink-0"
                                >
                                  <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                                  Lihat Berkas
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
