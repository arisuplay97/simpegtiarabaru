"use client"

import React, { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Edit,
  Download,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  GraduationCap,
  Award,
  Clock,
  TrendingUp,
  User,
  Heart,
  Users,
  Shield,
  CreditCard,
  Wallet,
  History,
  Target,
  Star,
} from "lucide-react"

// Data profil user yang sedang login (self-service)
const myProfile = {
  id: "current-user",
  nik: "19900610 201503 1 001",
  name: "Ahmad Rizki Pratama",
  avatar: null,
  initials: "AR",
  jabatan: "Analis Kepegawaian Muda",
  unitKerja: "Bagian SDM & Organisasi",
  golongan: "C/III",
  pangkat: "Penata",
  status: "aktif" as const,
  email: "ahmad.rizki@pdamtirtaselaras.co.id",
  emailPersonal: "ahmadrizki@gmail.com",
  telepon: "081234567890",
  teleponKantor: "021-5551234",
  alamat: "Jl. Merdeka No. 123, RT 05/RW 08, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310",
  tempatLahir: "Jakarta",
  tanggalLahir: "15 Januari 1985",
  jenisKelamin: "Laki-laki",
  agama: "Islam",
  statusPernikahan: "Menikah",
  golonganDarah: "O",
  noKTP: "3171011501850001",
  noKK: "3171010203040001",
  npwp: "12.345.678.9-012.000",
  noBPJSKes: "0001234567890",
  noBPJSTK: "1234567890123",
  tanggalMasuk: "15 Januari 2010",
  masaKerja: "16 tahun 2 bulan",
  pendidikan: "S1 Teknik Informatika - Universitas Indonesia (2007)",
  sisaCuti: 7,
  cutiTahunIni: 12,
  cutiDigunakan: 5,
}

const riwayatJabatan = [
  {
    jabatan: "Kepala Bagian IT",
    unit: "IT & Sistem",
    tmt: "01 Jan 2022",
    skNomor: "SK/2022/01/JAB-001",
    status: "current",
  },
  {
    jabatan: "Koordinator Sistem",
    unit: "IT & Sistem",
    tmt: "01 Jul 2018",
    skNomor: "SK/2018/07/JAB-055",
    status: "previous",
  },
  {
    jabatan: "Staff IT Senior",
    unit: "IT & Sistem",
    tmt: "01 Jan 2015",
    skNomor: "SK/2015/01/JAB-023",
    status: "previous",
  },
  {
    jabatan: "Staff IT",
    unit: "IT & Sistem",
    tmt: "15 Jan 2010",
    skNomor: "SK/2010/01/JAB-010",
    status: "previous",
  },
]

const riwayatPangkat = [
  {
    pangkat: "Penata",
    golongan: "C/III",
    tmt: "1 April 2023",
    skNomor: "800/123/SDM/2023",
    status: "current",
  },
  {
    pangkat: "Penata Muda Tk.I",
    golongan: "B/III",
    tmt: "1 April 2019",
    skNomor: "800/089/SDM/2019",
    status: "previous",
  },
  {
    pangkat: "Penata Muda",
    golongan: "A/III",
    tmt: "1 April 2015",
    skNomor: "800/045/SDM/2015",
    status: "previous",
  },
]

const riwayatGaji = [
  { periode: "Maret 2026", gajiPokok: 4850000, tunjangan: 3250000, potongan: 650000, netPay: 7450000 },
  { periode: "Februari 2026", gajiPokok: 4850000, tunjangan: 3250000, potongan: 650000, netPay: 7450000 },
  { periode: "Januari 2026", gajiPokok: 4850000, tunjangan: 3250000, potongan: 650000, netPay: 7450000 },
  { periode: "Desember 2025", gajiPokok: 4650000, tunjangan: 3250000, potongan: 650000, netPay: 7250000 },
]

const keluarga = [
  { hubungan: "Istri", nama: "Sari Dewi", tanggalLahir: "20 Mei 1987", pekerjaan: "Ibu Rumah Tangga" },
  { hubungan: "Anak", nama: "Raka Pratama", tanggalLahir: "10 Agustus 2012", pekerjaan: "Pelajar" },
  { hubungan: "Anak", nama: "Rina Pratama", tanggalLahir: "25 Desember 2015", pekerjaan: "Pelajar" },
]

const pendidikanFormal = [
  { jenjang: "S1", jurusan: "Teknik Informatika", institusi: "Universitas Indonesia", tahun: "2003-2007" },
  { jenjang: "SMA", jurusan: "IPA", institusi: "SMAN 1 Jakarta", tahun: "2000-2003" },
]

const pelatihan = [
  { nama: "Leadership Development Program", penyelenggara: "LAN RI", tahun: "2023", sertifikat: true },
  { nama: "Project Management Professional", penyelenggara: "PMI", tahun: "2022", sertifikat: true },
  { nama: "IT Security Management", penyelenggara: "BSSN", tahun: "2021", sertifikat: true },
]

const kpiData = {
  nilaiSKP: 91,
  targetTercapai: 8,
  totalTarget: 10,
  kategori: "Sangat Baik",
}

export default function MyProfilePage() {
  const [activeTab, setActiveTab] = useState("data-diri")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kepegawaian", "Profil Saya"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header Card */}
          <Card className="card-premium mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <Avatar className="h-28 w-28 border-4 border-primary/20">
                    <AvatarImage src={myProfile.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                      {myProfile.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-foreground">{myProfile.name}</h1>
                      <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{myProfile.jabatan}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {myProfile.unitKerja}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {myProfile.pangkat} ({myProfile.golongan})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {myProfile.masaKerja}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <a
                        href={`mailto:${myProfile.email}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {myProfile.email}
                      </a>
                      <a
                        href={`tel:${myProfile.telepon}`}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {myProfile.telepon}
                      </a>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">NIK: {myProfile.nik}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profil
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download CV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Dokumen Saya
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{kpiData.nilaiSKP}</p>
                      <p className="text-xs text-muted-foreground">Nilai SKP ({kpiData.kategori})</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <Calendar className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{myProfile.sisaCuti}</p>
                      <p className="text-xs text-muted-foreground">Sisa Cuti Tahun Ini</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                      <Star className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{kpiData.targetTercapai}/{kpiData.totalTarget}</p>
                      <p className="text-xs text-muted-foreground">Target Tercapai</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Award className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{pelatihan.length}</p>
                      <p className="text-xs text-muted-foreground">Sertifikasi</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="data-diri" className="gap-2">
                <User className="h-4 w-4" />
                Data Diri
              </TabsTrigger>
              <TabsTrigger value="keluarga" className="gap-2">
                <Users className="h-4 w-4" />
                Keluarga
              </TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-2">
                <History className="h-4 w-4" />
                Riwayat Karier
              </TabsTrigger>
              <TabsTrigger value="pendidikan" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Pendidikan
              </TabsTrigger>
              <TabsTrigger value="gaji" className="gap-2">
                <Wallet className="h-4 w-4" />
                Gaji & Tunjangan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data-diri">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Data Pribadi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "Nama Lengkap", value: myProfile.name },
                        { label: "NIK", value: myProfile.nik },
                        { label: "Tempat, Tanggal Lahir", value: `${myProfile.tempatLahir}, ${myProfile.tanggalLahir}` },
                        { label: "Jenis Kelamin", value: myProfile.jenisKelamin },
                        { label: "Agama", value: myProfile.agama },
                        { label: "Status Pernikahan", value: myProfile.statusPernikahan },
                        { label: "Golongan Darah", value: myProfile.golonganDarah },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between border-b border-border pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Dokumen Identitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "No. KTP", value: myProfile.noKTP },
                        { label: "No. KK", value: myProfile.noKK },
                        { label: "NPWP", value: myProfile.npwp },
                        { label: "No. BPJS Kesehatan", value: myProfile.noBPJSKes },
                        { label: "No. BPJS Ketenagakerjaan", value: myProfile.noBPJSTK },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between border-b border-border pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="font-mono text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="h-5 w-5 text-primary" />
                      Kontak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "Email Kantor", value: myProfile.email },
                        { label: "Email Pribadi", value: myProfile.emailPersonal },
                        { label: "No. HP", value: myProfile.telepon },
                        { label: "Telepon Kantor", value: myProfile.teleponKantor },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between border-b border-border pb-2 last:border-0">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      Alamat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{myProfile.alamat}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="keluarga">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-primary" />
                    Data Keluarga
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {keluarga.map((member, index) => (
                      <div key={index} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-secondary">
                            {member.nama.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.nama}</p>
                            <Badge variant="outline">{member.hubungan}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.tanggalLahir} | {member.pekerjaan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="riwayat">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Riwayat Jabatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative space-y-4 pl-6">
                      <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-border" />
                      {riwayatJabatan.map((item, index) => (
                        <div key={index} className="relative">
                          <div
                            className={`absolute -left-4 h-3 w-3 rounded-full ${
                              item.status === "current" ? "bg-primary" : "bg-muted"
                            }`}
                          />
                          <div className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{item.jabatan}</p>
                                <p className="text-sm text-muted-foreground">{item.unit}</p>
                              </div>
                              {item.status === "current" && (
                                <Badge className="bg-primary/10 text-primary">Saat Ini</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              TMT: {item.tmt} | {item.skNomor}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Riwayat Pangkat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative space-y-4 pl-6">
                      <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-border" />
                      {riwayatPangkat.map((item, index) => (
                        <div key={index} className="relative">
                          <div
                            className={`absolute -left-4 h-3 w-3 rounded-full ${
                              item.status === "current" ? "bg-primary" : "bg-muted"
                            }`}
                          />
                          <div className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{item.pangkat}</p>
                                <p className="text-sm text-muted-foreground">Golongan {item.golongan}</p>
                              </div>
                              {item.status === "current" && (
                                <Badge className="bg-primary/10 text-primary">Saat Ini</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              TMT: {item.tmt} | {item.skNomor}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pendidikan">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Pendidikan Formal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendidikanFormal.map((item, index) => (
                        <div key={index} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {item.jenjang}
                              </Badge>
                              <p className="font-medium">{item.jurusan}</p>
                              <p className="text-sm text-muted-foreground">{item.institusi}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">{item.tahun}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-primary" />
                      Pelatihan & Sertifikasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pelatihan.map((item, index) => (
                        <div key={index} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{item.nama}</p>
                              <p className="text-sm text-muted-foreground">{item.penyelenggara}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.sertifikat && (
                                <Badge className="bg-emerald-100 text-emerald-700">Sertifikat</Badge>
                              )}
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

            <TabsContent value="gaji">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="card-premium lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Riwayat Gaji (4 Bulan Terakhir)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riwayatGaji.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.periode}</p>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Gaji Pokok: {formatCurrency(item.gajiPokok)}
                                </span>
                                <span className="text-emerald-600">
                                  + Tunjangan: {formatCurrency(item.tunjangan)}
                                </span>
                                <span className="text-red-600">
                                  - Potongan: {formatCurrency(item.potongan)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(item.netPay)}
                              </p>
                              <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs">
                                Lihat Slip
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" />
                      Info BPJS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground">BPJS Kesehatan</p>
                        <p className="font-mono text-sm font-medium">{myProfile.noBPJSKes}</p>
                        <Badge className="mt-2 bg-emerald-100 text-emerald-700">Aktif</Badge>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground">BPJS Ketenagakerjaan</p>
                        <p className="font-mono text-sm font-medium">{myProfile.noBPJSTK}</p>
                        <Badge className="mt-2 bg-emerald-100 text-emerald-700">Aktif</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
