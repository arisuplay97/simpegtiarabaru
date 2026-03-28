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
import { getPegawaiActivityLogs } from "@/lib/actions/audit-log"
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
  CheckCircle2, AlertCircle, Camera,
} from "lucide-react"

const statusConfig: Record<string, { label: string; className: string }> = {
  AKTIF: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CUTI: { label: "Cuti", className: "bg-amber-100 text-amber-700 border-amber-200" },
  NON_AKTIF: { label: "Non-Aktif", className: "bg-gray-100 text-gray-700 border-gray-200" },
  PENSIUN: { label: "Pensiun", className: "bg-red-100 text-red-700 border-red-200" },
}

export default function ProfilBasePage() {
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [employee, setEmployee] = useState<any>(null)
  const [attendanceSummary, setAttendanceSummary] = useState<any>({ hadir: 0, izin: 0, sakit: 0, cuti: 0, alpha: 0, terlambat: 0 })
  const [dokumenList, setDokumenList] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("profil")

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      setError("Anda belum login.")
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
      setError("Gagal memuat profil.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employee) return
    setIsUploading(true)
    toast.loading("Mengupload foto...")
    try {
      const formData = new FormData()
      formData.append("pegawaiId", employee.id)
      formData.append("fotoFile", file)
      const res = await fetch("/api/pegawai/upload-foto", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal upload")
      setEmployee((prev: any) => ({ ...prev, fotoUrl: json.url }))
      // Update session image so sidebar/topbar refresh
      await update({ picture: json.url })
      toast.dismiss()
      toast.success("Foto profil berhasil diperbarui!")
    } catch (err: any) {
      toast.dismiss()
      toast.error(err.message || "Gagal mengunggah foto")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Profil Saya"]} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Memuat profil Anda...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Akses Profil</h1>
                  <p className="text-muted-foreground max-w-sm mt-2">{error}</p>
                </div>
              </div>
            ) : employee ? (
              <>
                {/* Profile Header Card */}
                <Card className="card-premium">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                      {/* Avatar + upload */}
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-28 w-28 shrink-0 border-2 border-primary/10">
                          {employee.fotoUrl ? (
                            <AvatarImage src={employee.fotoUrl} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/5 text-3xl text-primary">
                            {(employee.nama || "P").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                          <span className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                            <Camera className="h-3 w-3" />
                            {isUploading ? "Uploading..." : "Ganti Foto"}
                          </span>
                        </label>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-2xl font-bold">{employee.nama}</h1>
                          <Badge variant="outline" className={statusConfig[employee.status || "AKTIF"]?.className}>
                            {statusConfig[employee.status || "AKTIF"]?.label || employee.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-lg text-muted-foreground">{employee.jabatan}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span className="font-semibold text-primary">{employee.tipePegawai || "TETAP"}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" />
                            {employee.bidang?.nama || "-"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" />
                            Golongan {employee.golongan || "-"}
                          </span>
                          <span className="flex items-center gap-1.5" suppressHydrationWarning>
                            <Calendar className="h-4 w-4" />
                            Masuk: {employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd/MM/yyyy") : "-"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                          {employee.email && (
                            <a href={`mailto:${employee.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                              <Mail className="h-4 w-4" />
                              {employee.email}
                            </a>
                          )}
                          {employee.telepon && (
                            <a href={`tel:${employee.telepon}`} className="flex items-center gap-1.5 text-primary hover:underline">
                              <Phone className="h-4 w-4" />
                              {employee.telepon}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pendidikan</p>
                          <p className="font-medium">{employee.pendidikanTerakhir || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                          <CreditCard className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bank</p>
                          <p className="font-medium">{employee.bank || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                          <Shield className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">BPJS Kesehatan</p>
                          <p className="font-medium">{employee.bpjsKesehatan || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Atasan Langsung</p>
                          <p className="font-medium">{employee.atasanLangsung || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ringkasan Absensi Bulan Ini */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Hadir", value: attendanceSummary.hadir, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Izin", value: attendanceSummary.izin, color: "text-blue-600 bg-blue-50" },
                    { label: "Sakit", value: attendanceSummary.sakit, color: "text-sky-600 bg-sky-50" },
                    { label: "Cuti", value: attendanceSummary.cuti, color: "text-purple-600 bg-purple-50" },
                    { label: "Terlambat", value: attendanceSummary.terlambat, color: "text-amber-600 bg-amber-50" },
                    { label: "Alpha", value: attendanceSummary.alpha, color: "text-red-600 bg-red-50" },
                  ].map(s => (
                    <Card key={s.label} className="card-premium">
                      <CardContent className="p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Data Detail */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="profil" className="gap-2"><User className="h-4 w-4" />Data Pribadi</TabsTrigger>
                    <TabsTrigger value="dokumen" className="gap-2"><FileText className="h-4 w-4" />Dokumen</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profil">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card className="card-premium">
                        <CardHeader><CardTitle className="text-base">Data Pribadi</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {[
                            { label: "NIK", value: employee.nik },
                            { label: "Jenis Kelamin", value: employee.jenisKelamin },
                            { label: "Tempat Lahir", value: employee.tempatLahir },
                            { label: "Tanggal Lahir", value: employee.tanggalLahir ? format(new Date(employee.tanggalLahir), "dd MMMM yyyy", { locale: idLocale }) : "-" },
                            { label: "Agama", value: employee.agama },
                            { label: "Status Nikah", value: employee.statusNikah },
                            { label: "Alamat", value: employee.alamat },
                          ].map(row => (
                            <div key={row.label} className="flex justify-between gap-4">
                              <span className="text-muted-foreground shrink-0">{row.label}</span>
                              <span className="font-medium text-right">{row.value || "-"}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                      <Card className="card-premium">
                        <CardHeader><CardTitle className="text-base">Data Kepegawaian</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {[
                            { label: "Jabatan", value: employee.jabatan },
                            { label: "Bidang", value: employee.bidang?.nama },
                            { label: "Golongan", value: employee.golongan },
                            { label: "Pangkat", value: employee.pangkat },
                            { label: "NPWP", value: employee.npwp },
                            { label: "BPJS Ketenagakerjaan", value: employee.bpjsKetenagakerjaan },
                            { label: "No. Rekening", value: employee.noRekening },
                          ].map(row => (
                            <div key={row.label} className="flex justify-between gap-4">
                              <span className="text-muted-foreground shrink-0">{row.label}</span>
                              <span className="font-medium text-right">{row.value || "-"}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="dokumen">
                    <Card className="card-premium">
                      <CardHeader><CardTitle className="text-base">Dokumen Saya</CardTitle></CardHeader>
                      <CardContent>
                        {dokumenList.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-8">Belum ada dokumen yang diunggah.</p>
                        ) : (
                          <div className="space-y-2">
                            {dokumenList.map((d: any) => (
                              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="text-sm font-medium">{d.namaDokumen}</p>
                                  <p className="text-xs text-muted-foreground">{d.jenisDokumen} · {d.tanggalUpload ? format(new Date(d.tanggalUpload), "dd MMM yyyy") : ""}</p>
                                </div>
                                {d.fileUrl && (
                                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                    Lihat
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
