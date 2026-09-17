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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  User, Building2, Briefcase, Calendar, Mail, Phone,
  GraduationCap, CreditCard, Shield, Clock, Target,
  FileText, BookOpen, History, Users, TrendingUp,
  CheckCircle2, AlertCircle, Camera, Download, ExternalLink
} from "lucide-react"

const statusConfig: Record<string, { label: string; dot: string; badgeClass: string }> = {
  AKTIF: { 
    label: "Aktif", 
    dot: "bg-emerald-500", 
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
  },
  CUTI: { 
    label: "Cuti", 
    dot: "bg-amber-500", 
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400" 
  },
  NON_AKTIF: { 
    label: "Non-Aktif", 
    dot: "bg-slate-400", 
    badgeClass: "border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300" 
  },
  PENSIUN: { 
    label: "Pensiun", 
    dot: "bg-rose-500", 
    badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400" 
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

  const statusKey = (employee?.status || "AKTIF").toUpperCase()
  const statusInfo = statusConfig[statusKey] || statusConfig.AKTIF

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background text-slate-900 dark:text-zinc-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kepegawaian", "Profil Saya"]} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="mx-auto max-w-5xl space-y-6">
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
                {/* Executive Profile Card */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-5 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar + change button */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="relative group">
                        <Avatar className="h-24 w-24 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs">
                          {employee.fotoUrl ? (
                            <AvatarImage src={employee.fotoUrl} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="rounded-2xl bg-slate-100 dark:bg-zinc-800 text-2xl font-bold text-slate-700 dark:text-zinc-200">
                            {(employee.nama || "P")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-medium">
                          <Camera className="h-4 w-4 mb-0.5" />
                          Ganti
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <span className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium">
                          <Camera className="h-3 w-3" />
                          {isUploading ? "Mengunggah..." : "Ubah Foto"}
                        </span>
                      </label>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
                      <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                            {employee.nama}
                          </h1>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-zinc-400">
                          {employee.jabatan || "Pegawai"}
                        </p>
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80 font-mono text-[11px]">
                          NIK: {employee.nik}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          {employee.bidang?.nama || "Kantor Pusat"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80 font-mono">
                          Gol. {employee.golongan || "—"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80" suppressHydrationWarning>
                          <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          TMT: {employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd/MM/yyyy") : "—"}
                        </span>
                      </div>

                      {/* Contact Links */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
                        {employee.email && (
                          <a
                            href={`mailto:${employee.email}`}
                            className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-primary transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                            {employee.email}
                          </a>
                        )}
                        {employee.telepon && (
                          <a
                            href={`tel:${employee.telepon}`}
                            className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-primary transition-colors font-mono"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                            {employee.telepon}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 Summary Quick Stats */}
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">Pendidikan Terakhir</span>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {employee.pendidikanTerakhir || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">Rekening Bank</span>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {employee.bank ? `${employee.bank} - ${employee.noRekening || ""}` : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">BPJS Kesehatan</span>
                      <p className="mt-0.5 font-semibold font-mono text-slate-800 dark:text-zinc-200 truncate">
                        {employee.bpjsKesehatan || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">Atasan Langsung</span>
                      <p className="mt-0.5 font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {employee.atasanLangsung || "—"}
                      </p>
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
                  <TabsList className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <TabsTrigger
                      value="profil"
                      className="rounded-lg text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs gap-1.5"
                    >
                      <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Data Lengkap Pegawai
                    </TabsTrigger>
                    <TabsTrigger
                      value="dokumen"
                      className="rounded-lg text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Dokumen Pegawai ({dokumenList.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Content: Profil Data */}
                  <TabsContent value="profil" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card Data Pribadi */}
                      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <User className="h-4 w-4 text-primary" strokeWidth={1.75} />
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            Identitas & Biodata Pribadi
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                          {[
                            { label: "Nomor Induk Karyawan (NIK)", value: employee.nik, mono: true },
                            { label: "Jenis Kelamin", value: employee.jenisKelamin === "L" ? "Laki-laki" : employee.jenisKelamin === "P" ? "Perempuan" : "—" },
                            { label: "Tempat, Tanggal Lahir", value: `${employee.tempatLahir || "—"}, ${employee.tanggalLahir ? format(new Date(employee.tanggalLahir), "dd MMMM yyyy", { locale: idLocale }) : "—"}` },
                            { label: "Agama", value: employee.agama },
                            { label: "Status Pernikahan", value: employee.statusNikah },
                            { label: "Alamat Domisili", value: employee.alamat },
                          ].map(row => (
                            <div key={row.label} className="py-2.5 flex justify-between gap-4">
                              <span className="text-slate-500 dark:text-zinc-400 shrink-0">{row.label}</span>
                              <span className={`font-medium text-right text-slate-900 dark:text-zinc-100 ${row.mono ? "font-mono" : ""}`}>
                                {row.value || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Data Kepegawaian & Finansial */}
                      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <Briefcase className="h-4 w-4 text-primary" strokeWidth={1.75} />
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            Kepegawaian & Finansial
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                          {[
                            { label: "Jabatan Struktural", value: employee.jabatan },
                            { label: "Unit Kerja / Bidang", value: employee.bidang?.nama },
                            { label: "Golongan & Pangkat", value: `${employee.golongan || "—"} / ${employee.pangkat || "—"}` },
                            { label: "NPWP", value: employee.npwp, mono: true },
                            { label: "BPJS Ketenagakerjaan", value: employee.bpjsKetenagakerjaan, mono: true },
                            { label: "Bank & Nomor Rekening", value: employee.bank ? `${employee.bank} - ${employee.noRekening || "—"}` : "—" },
                          ].map(row => (
                            <div key={row.label} className="py-2.5 flex justify-between gap-4">
                              <span className="text-slate-500 dark:text-zinc-400 shrink-0">{row.label}</span>
                              <span className={`font-medium text-right text-slate-900 dark:text-zinc-100 ${row.mono ? "font-mono" : ""}`}>
                                {row.value || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Content: Dokumen */}
                  <TabsContent value="dokumen">
                    <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-5 shadow-xs space-y-3">
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
