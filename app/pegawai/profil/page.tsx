"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getEmployeeByUserId, updateEmployee, uploadAvatar } from "@/lib/actions/pegawai"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Edit, Download, FileText, Mail, Phone, MapPin,
  Calendar, Briefcase, Building2, GraduationCap,
  Award, Clock, TrendingUp, User, Heart, Users,
  Shield, CreditCard, Wallet, History, Target,
  Star, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// ============ DATA PROFIL ============
const initialProfile = {
  id: "current-user",
  nik: "3201150115850001",
  name: "Ahmad Rizki Pratama",
  initials: "AR",
  jabatan: "Kepala Bagian Teknologi Informasi",
  unitKerja: "IT & Sistem",
  golongan: "C/III",
  pangkat: "Penata",
  status: "aktif" as const,
  sp: null as "SP1" | "SP2" | "SP3" | null,
  masaKerja: "16 tahun 2 bulan",
  email: "ahmad.rizki@pdamtiara.co.id",
  emailPersonal: "ahmadrizki@gmail.com",
  telepon: "081234567890",
  teleponKantor: "021-5551234",
  alamat: "Jl. Merdeka No. 123, RT 05/RW 08, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310",
  tempatLahir: "Bandung",
  tanggalLahir: "15 Januari 1985",
  jenisKelamin: "Laki-laki",
  agama: "Islam",
  statusNikah: "Menikah",
  golonganDarah: "O",
  noKTP: "3201150115850001",
  noKK: "3201010203040001",
  npwp: "12.345.678.9-012.000",
  noBPJSKes: "0001234567890",
  noBPJSTK: "1234567890123",
  bank: "Bank Mandiri",
  noRekening: "1234567890123",
  tanggalMasuk: "15 Januari 2010",
  pendidikan: "S2 - Teknik Informatika",
  sisaCuti: 7,
  cutiTahunIni: 12,
  cutiDigunakan: 5,
}

const riwayatJabatan = [
  { jabatan:"Kepala Bagian IT", unit:"IT & Sistem", tmt:"01 Jan 2022", skNomor:"SK/2022/01/JAB-001", status:"current" },
  { jabatan:"Koordinator Sistem", unit:"IT & Sistem", tmt:"01 Jul 2018", skNomor:"SK/2018/07/JAB-055", status:"previous" },
  { jabatan:"Staff IT Senior", unit:"IT & Sistem", tmt:"01 Jan 2015", skNomor:"SK/2015/01/JAB-023", status:"previous" },
  { jabatan:"Staff IT", unit:"IT & Sistem", tmt:"15 Jan 2010", skNomor:"SK/2010/01/JAB-010", status:"previous" },
]

const riwayatPangkat = [
  { pangkat:"Penata", golongan:"C/III", tmt:"1 April 2023", skNomor:"800/123/SDM/2023", status:"current" },
  { pangkat:"Penata Muda Tk.I", golongan:"B/III", tmt:"1 April 2019", skNomor:"800/089/SDM/2019", status:"previous" },
  { pangkat:"Penata Muda", golongan:"A/III", tmt:"1 April 2015", skNomor:"800/045/SDM/2015", status:"previous" },
]

const riwayatGaji = [
  { periode:"Maret 2026", gajiPokok:5850000, tunjangan:3200000, potongan:1245000, netPay:7805000 },
  { periode:"Februari 2026", gajiPokok:5850000, tunjangan:3150000, potongan:1230000, netPay:7770000 },
  { periode:"Januari 2026", gajiPokok:5850000, tunjangan:3100000, potongan:1218000, netPay:7732000 },
  { periode:"Desember 2025", gajiPokok:5850000, tunjangan:3050000, potongan:1200000, netPay:7700000 },
]

const keluarga = [
  { hubungan:"Istri", nama:"Sari Dewi", tanggalLahir:"20 Mei 1987", pekerjaan:"Ibu Rumah Tangga" },
  { hubungan:"Anak", nama:"Raka Pratama", tanggalLahir:"10 Agustus 2012", pekerjaan:"Pelajar" },
  { hubungan:"Anak", nama:"Rina Pratama", tanggalLahir:"25 Desember 2015", pekerjaan:"Pelajar" },
]

const pendidikanFormal = [
  { jenjang:"S2", jurusan:"Teknik Informatika", institusi:"Institut Teknologi Bandung", tahun:"2007-2012" },
  { jenjang:"S1", jurusan:"Teknik Informatika", institusi:"Universitas Padjadjaran", tahun:"2003-2007" },
  { jenjang:"SMA", jurusan:"IPA", institusi:"SMA Negeri 3 Bandung", tahun:"2000-2003" },
]

const pelatihan = [
  { nama:"Leadership Development Program", penyelenggara:"LAN RI", tahun:"2023", sertifikat:true },
  { nama:"Project Management Professional", penyelenggara:"PMI", tahun:"2022", sertifikat:true },
  { nama:"IT Security Management", penyelenggara:"BSSN", tahun:"2021", sertifikat:true },
  { nama:"Cloud Computing Fundamentals", penyelenggara:"AWS", tahun:"2020", sertifikat:true },
]

const kpiData = {
  nilaiSKP: 91,
  targetTercapai: 8,
  totalTarget: 10,
  kategori: "Sangat Baik",
  targets: [
    { name:"Uptime Sistem", target:99.5, actual:99.8, weight:30 },
    { name:"Response Time", target:2, actual:1.5, weight:25 },
    { name:"Project Completion", target:100, actual:95, weight:25 },
    { name:"Team Development", target:100, actual:90, weight:20 },
  ]
}

const spConfig = {
  SP1: { label:"SP-1", className:"bg-gray-100 text-gray-600 border-gray-300" },
  SP2: { label:"SP-2", className:"bg-amber-100 text-amber-700 border-amber-300" },
  SP3: { label:"SP-3", className:"bg-red-100 text-red-700 border-red-300" },
}

const formatCurrency = (v: number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(v)

// ============ KOMPONEN UTAMA ============
export default function MyProfilePage() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("data-diri")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const data = await getEmployeeByUserId(userId)
      if (data) {
        setProfile({
          ...data,
          initials: data.nama ? data.nama.split(" ").map((n:any)=>n[0]).join("").slice(0,2).toUpperCase() : "AA",
          name: data.nama || "User",
          nik: data.nik || "-",
          // Fallback fields for UI compatibility
          noKTP: data.nik || "-",
          noBPJSKes: data.bpjsKesehatan || "-",
          noBPJSTK: data.bpjsKetenagakerjaan || "-",
          tanggalMasuk: data.tanggalMasuk ? new Date(data.tanggalMasuk).toLocaleDateString("id-ID") : "-",
        })
        setForm({ ...data })
      }
    } catch (error) {
      toast.error("Gagal mengambil data profil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const url = await uploadAvatar(formData)
      setForm((prev: any) => ({ ...prev, avatar: url }))
      setPreviewUrl(url)
      toast.success("Foto profil berhasil diunggah")
    } catch (error) {
      toast.error("Gagal mengunggah foto profil")
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenEdit = () => {
    setForm({ ...profile })
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      await updateEmployee(profile.id, form)
      await fetchProfile()
      setShowEditDialog(false)
      toast.success("Profil berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui profil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadCV = () => {
    const content = `CURRICULUM VITAE\n================\nNama      : ${profile.name}\nNIK       : ${profile.nik}\nJabatan   : ${profile.jabatan}\nUnit Kerja: ${profile.unitKerja}\nGolongan  : ${profile.golongan} (${profile.pangkat})\nMasa Kerja: ${profile.masaKerja}\nPendidikan: ${profile.pendidikan}\nEmail     : ${profile.email}\nTelepon   : ${profile.telepon}\nAlamat    : ${profile.alamat}`.trim()
    const blob = new Blob([content], {type:"text/plain"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=`CV-${(profile.name || "Pegawai").replace(/\s+/g,"-")}.txt`; a.click()
    URL.revokeObjectURL(url)
    toast.success("CV berhasil didownload")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">Profil tidak ditemukan. Pastikan Anda sudah login atau ID pegawai sudah terdaftar.</p>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav/>
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian","Profil Saya"]}/>
        <main className="flex-1 overflow-auto p-6">

          {/* Header Card */}
          <Card className="card-premium mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <Avatar className="h-28 w-28 border-4 border-primary/20">
                    <AvatarFallback className="bg-primary text-2xl text-primary-foreground">{profile.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold">{profile.name}</h1>
                      <Badge className={profile.status==="aktif"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}>
                        {profile.status==="aktif"?"Aktif":profile.status==="cuti"?"Cuti":"Non-Aktif"}
                      </Badge>
                      {profile.sp && (
                        <Badge variant="outline" className={spConfig[profile.sp as keyof typeof spConfig]?.className || ""}>
                          {spConfig[profile.sp as keyof typeof spConfig]?.label || profile.sp}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground">{profile.jabatan}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-4 w-4"/>{profile.unitKerja}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/>{profile.pangkat} ({profile.golongan})</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{profile.masaKerja}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <a href={`mailto:${profile.email}`} className="flex items-center gap-1 text-primary hover:underline"><Mail className="h-4 w-4"/>{profile.email}</a>
                      <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-4 w-4"/>{profile.telepon}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">NIK: {profile.nik}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenEdit}><Edit className="h-4 w-4"/>Edit Profil</Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadCV}><Download className="h-4 w-4"/>Download CV</Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon:Target, bg:"bg-primary/10", color:"text-primary", value:kpiData.nilaiSKP, label:`Nilai SKP (${kpiData.kategori})` },
                  { icon:Calendar, bg:"bg-emerald-100", color:"text-emerald-700", value:profile.sisaCuti, label:"Sisa Cuti Tahun Ini" },
                  { icon:Star, bg:"bg-amber-100", color:"text-amber-700", value:`${kpiData.targetTercapai}/${kpiData.totalTarget}`, label:"Target Tercapai" },
                  { icon:Award, bg:"bg-blue-100", color:"text-blue-700", value:pelatihan.length, label:"Sertifikasi" },
                ].map((s,i)=>(
                  <div key={i} className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
                    <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="data-diri" className="gap-2"><User className="h-4 w-4"/>Data Diri</TabsTrigger>
              <TabsTrigger value="keluarga" className="gap-2"><Users className="h-4 w-4"/>Keluarga</TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-2"><History className="h-4 w-4"/>Riwayat Karier</TabsTrigger>
              <TabsTrigger value="pendidikan" className="gap-2"><GraduationCap className="h-4 w-4"/>Pendidikan</TabsTrigger>
              <TabsTrigger value="kinerja" className="gap-2"><Target className="h-4 w-4"/>Kinerja</TabsTrigger>
              <TabsTrigger value="gaji" className="gap-2"><Wallet className="h-4 w-4"/>Gaji</TabsTrigger>
            </TabsList>

            {/* Tab Data Diri */}
            <TabsContent value="data-diri">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/>Data Pribadi</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {label:"Nama Lengkap",value:profile.name},
                        {label:"NIK",value:profile.nik},
                        {label:"Tempat, Tanggal Lahir",value:`${profile.tempatLahir}, ${profile.tanggalLahir}`},
                        {label:"Jenis Kelamin",value:profile.jenisKelamin},
                        {label:"Agama",value:profile.agama},
                        {label:"Status Pernikahan",value:profile.statusNikah},
                        {label:"Golongan Darah",value:profile.golonganDarah},
                      ].map(item=>(
                        <div key={item.label} className="flex justify-between border-b pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Data Kepegawaian</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {label:"Jabatan",value:profile.jabatan},
                        {label:"Unit Kerja",value:profile.unitKerja},
                        {label:"Golongan",value:profile.golongan},
                        {label:"Pangkat",value:profile.pangkat},
                        {label:"TMT Kerja",value:profile.tanggalMasuk},
                        {label:"Masa Kerja",value:profile.masaKerja},
                        {label:"Pendidikan Terakhir",value:profile.pendidikan},
                      ].map(item=>(
                        <div key={item.label} className="flex justify-between border-b pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Dokumen Identitas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {label:"No. KK",value:profile.noKK},
                        {label:"NPWP",value:profile.npwp},
                        {label:"No. BPJS Kesehatan",value:profile.noBPJSKes},
                        {label:"No. BPJS Ketenagakerjaan",value:profile.noBPJSTK},
                        {label:"Bank",value:profile.bank},
                        {label:"No. Rekening",value:profile.noRekening},
                      ].map(item=>(
                        <div key={item.label} className="flex justify-between border-b pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="font-mono text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/>Kontak & Alamat</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {label:"Email Kantor",value:profile.email},
                        {label:"Email Pribadi",value:profile.emailPersonal},
                        {label:"No. HP",value:profile.telepon},
                        {label:"Telepon Kantor",value:profile.teleponKantor},
                      ].map(item=>(
                        <div key={item.label} className="flex justify-between border-b pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4"/>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Alamat</p>
                      <p className="text-sm leading-relaxed">{profile.alamat}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Keluarga */}
            <TabsContent value="keluarga">
              <Card className="card-premium">
                <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary"/>Data Keluarga</CardTitle></CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {keluarga.map((member,i)=>(
                      <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <Avatar className="h-12 w-12"><AvatarFallback className="bg-secondary">{member.nama.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.nama}</p>
                            <Badge variant="outline">{member.hubungan}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.tanggalLahir} | {member.pekerjaan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Riwayat Karier */}
            <TabsContent value="riwayat">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Riwayat Jabatan</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative space-y-4 pl-6">
                      <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-border"/>
                      {riwayatJabatan.map((item,i)=>(
                        <div key={i} className="relative">
                          <div className={`absolute -left-4 h-3 w-3 rounded-full ${item.status==="current"?"bg-primary":"bg-muted"}`}/>
                          <div className="rounded-lg border p-3">
                            <div className="flex items-start justify-between">
                              <div><p className="font-medium">{item.jabatan}</p><p className="text-sm text-muted-foreground">{item.unit}</p></div>
                              {item.status==="current"&&<Badge className="bg-primary/10 text-primary">Saat Ini</Badge>}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">TMT: {item.tmt} | {item.skNomor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/>Riwayat Pangkat</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative space-y-4 pl-6">
                      <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-border"/>
                      {riwayatPangkat.map((item,i)=>(
                        <div key={i} className="relative">
                          <div className={`absolute -left-4 h-3 w-3 rounded-full ${item.status==="current"?"bg-primary":"bg-muted"}`}/>
                          <div className="rounded-lg border p-3">
                            <div className="flex items-start justify-between">
                              <div><p className="font-medium">{item.pangkat}</p><p className="text-sm text-muted-foreground">Golongan {item.golongan}</p></div>
                              {item.status==="current"&&<Badge className="bg-primary/10 text-primary">Saat Ini</Badge>}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">TMT: {item.tmt} | {item.skNomor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Pendidikan */}
            <TabsContent value="pendidikan">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/>Pendidikan Formal</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendidikanFormal.map((item,i)=>(
                        <div key={i} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div><Badge variant="outline" className="mb-2">{item.jenjang}</Badge><p className="font-medium">{item.jurusan}</p><p className="text-sm text-muted-foreground">{item.institusi}</p></div>
                            <span className="text-sm text-muted-foreground">{item.tahun}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Pelatihan & Sertifikasi</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pelatihan.map((item,i)=>(
                        <div key={i} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div><p className="font-medium">{item.nama}</p><p className="text-sm text-muted-foreground">{item.penyelenggara}</p></div>
                            <div className="flex items-center gap-2">
                              {item.sertifikat&&<Badge className="bg-emerald-100 text-emerald-700">Sertifikat</Badge>}
                              <span className="text-sm text-muted-foreground">{item.tahun}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Kinerja */}
            <TabsContent value="kinerja">
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary"/>KPI Tahun 2026</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700">Score: {kpiData.nilaiSKP}% — {kpiData.kategori}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {kpiData.targets.map((target,i)=>(
                      <div key={i}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{target.name}</span>
                            <Badge variant="outline" className="text-xs">Bobot: {target.weight}%</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{target.actual} / {target.target}</span>
                            {target.actual >= target.target
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/>
                              : <AlertCircle className="h-4 w-4 text-amber-600"/>}
                          </div>
                        </div>
                        <Progress value={(target.actual/target.target)*100} className="h-2"/>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Gaji */}
            <TabsContent value="gaji">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="card-premium lg:col-span-2">
                  <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary"/>Riwayat Gaji (4 Bulan Terakhir)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riwayatGaji.map((item,i)=>(
                        <div key={i} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.periode}</p>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                <span className="text-muted-foreground">Pokok: {formatCurrency(item.gajiPokok)}</span>
                                <span className="text-emerald-600">+ {formatCurrency(item.tunjangan)}</span>
                                <span className="text-red-600">- {formatCurrency(item.potongan)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">{formatCurrency(item.netPay)}</p>
                              <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs">Lihat Slip</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>BPJS & Bank</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">BPJS Kesehatan</p>
                      <p className="font-mono text-sm font-medium mt-1">{profile.noBPJSKes}</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700">Aktif</Badge>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">BPJS Ketenagakerjaan</p>
                      <p className="font-mono text-sm font-medium mt-1">{profile.noBPJSTK}</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700">Aktif</Badge>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">{profile.bank}</p>
                      <p className="font-mono text-sm font-medium mt-1">{profile.noRekening}</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-700">Rekening Gaji</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Dialog Edit Profil */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profil Saya</DialogTitle>
            <DialogDescription>Perbarui data diri Anda. Beberapa field memerlukan persetujuan HRD.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Pribadi</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nama Lengkap</Label>
                  <Input className="mt-1" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
                </div>
                <div>
                  <Label>Tempat Lahir</Label>
                  <Input className="mt-1" value={form.tempatLahir} onChange={e=>setForm({...form,tempatLahir:e.target.value})}/>
                </div>
                <div>
                  <Label>Tanggal Lahir</Label>
                  <Input className="mt-1" value={form.tanggalLahir} onChange={e=>setForm({...form,tanggalLahir:e.target.value})}/>
                </div>
                <div>
                  <Label>Agama</Label>
                  <Select value={form.agama} onValueChange={v=>setForm({...form,agama:v})}>
                    <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"].map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status Pernikahan</Label>
                  <Select value={form.statusNikah} onValueChange={v=>setForm({...form,statusNikah:v})}>
                    <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="Belum Menikah">Belum Menikah</SelectItem><SelectItem value="Menikah">Menikah</SelectItem><SelectItem value="Cerai">Cerai</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Alamat</Label>
                  <Textarea className="mt-1" value={form.alamat} onChange={e=>setForm({...form,alamat:e.target.value})} rows={2}/>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kontak</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email Kantor</Label>
                  <Input className="mt-1" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
                </div>
                <div>
                  <Label>Email Pribadi</Label>
                  <Input className="mt-1" value={form.emailPersonal} onChange={e=>setForm({...form,emailPersonal:e.target.value})}/>
                </div>
                <div>
                  <Label>No. HP</Label>
                  <Input className="mt-1" value={form.telepon} onChange={e=>setForm({...form,telepon:e.target.value})}/>
                </div>
                <div>
                  <Label>Telepon Kantor</Label>
                  <Input className="mt-1" value={form.teleponKantor} onChange={e=>setForm({...form,teleponKantor:e.target.value})}/>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dokumen & Keuangan</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>NPWP</Label>
                  <Input className="mt-1 font-mono" value={form.npwp} onChange={e=>setForm({...form,npwp:e.target.value})}/>
                </div>
                <div>
                  <Label>Bank</Label>
                  <Select value={form.bank} onValueChange={v=>setForm({...form,bank:v})}>
                    <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{["Bank Mandiri","Bank BNI","Bank BRI","Bank BCA","Bank BTN"].map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>No. Rekening</Label>
                  <Input className="mt-1 font-mono" value={form.noRekening} onChange={e=>setForm({...form,noRekening:e.target.value})}/>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menyimpan...</> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
