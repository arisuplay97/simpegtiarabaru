"use client"

import { useState } from "react"
import Link from "next/link"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Edit,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  GraduationCap,
  CreditCard,
  Shield,
  User,
  Users,
  FileText,
  Clock,
  Target,
  Award,
  BookOpen,
  History,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useParams } from "next/navigation"
import { pegawaiData } from "@/lib/data/pegawai-store"

const statusConfig = {
  aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cuti: { label: "Cuti", className: "bg-amber-100 text-amber-700 border-amber-200" },
  "non-aktif": { label: "Non-Aktif", className: "bg-gray-100 text-gray-700 border-gray-200" },
  pensiun: { label: "Pensiun", className: "bg-red-100 text-red-700 border-red-200" },
}

const spConfig = {
  SP1: { label: "SP-1", className: "bg-gray-100 text-gray-600 border-gray-300" },
  SP2: { label: "SP-2", className: "bg-amber-100 text-amber-700 border-amber-300" },
  SP3: { label: "SP-3", className: "bg-red-100 text-red-700 border-red-300" },
}

// ... (other histories stay the same or could be made dynamic if needed)

const familyMembers = [
  { nama: "Siti Aminah", hubungan: "Istri", tanggalLahir: "23 Mar 1987", pekerjaan: "Ibu Rumah Tangga", statusTanggungan: "Ya" },
  { nama: "Ahmad Fauzan", hubungan: "Anak", tanggalLahir: "10 Jul 2012", pekerjaan: "Pelajar", statusTanggungan: "Ya" },
  { nama: "Aisyah Putri", hubungan: "Anak", tanggalLahir: "05 Feb 2015", pekerjaan: "Pelajar", statusTanggungan: "Ya" },
]

const educationHistory = [
  { jenjang: "S2", institusi: "Institut Teknologi Bandung", jurusan: "Teknik Informatika", tahunLulus: "2012", ipk: "3.75" },
  { jenjang: "S1", institusi: "Universitas Padjadjaran", jurusan: "Teknik Informatika", tahunLulus: "2007", ipk: "3.45" },
  { jenjang: "SMA", institusi: "SMA Negeri 3 Bandung", jurusan: "IPA", tahunLulus: "2003", ipk: "-" },
]

const positionHistory = [
  { jabatan: "Kepala Bagian IT", unitKerja: "IT & Sistem", tmtMulai: "01 Jan 2022", tmtSelesai: "Sekarang", nomorSK: "SK/123/2022" },
  { jabatan: "Kepala Seksi Pengembangan Sistem", unitKerja: "IT & Sistem", tmtMulai: "01 Mar 2018", tmtSelesai: "31 Des 2021", nomorSK: "SK/089/2018" },
  { jabatan: "Staff IT Senior", unitKerja: "IT & Sistem", tmtMulai: "01 Jan 2014", tmtSelesai: "28 Feb 2018", nomorSK: "SK/045/2014" },
  { jabatan: "Staff IT", unitKerja: "IT & Sistem", tmtMulai: "15 Jan 2010", tmtSelesai: "31 Des 2013", nomorSK: "SK/012/2010" },
]

const rankHistory = [
  { pangkat: "Penata", golongan: "C/III", tmtPangkat: "01 Apr 2020", nomorSK: "SK/PP/456/2020" },
  { pangkat: "Penata Muda Tk.I", golongan: "B/III", tmtPangkat: "01 Apr 2016", nomorSK: "SK/PP/234/2016" },
  { pangkat: "Penata Muda", golongan: "A/III", tmtPangkat: "15 Jan 2010", nomorSK: "SK/PP/012/2010" },
]

const salaryHistory = [
  { periode: "Maret 2026", gajiPokok: "Rp 5.850.000", tunjangan: "Rp 3.200.000", potongan: "Rp 1.245.000", gajiBersih: "Rp 7.805.000" },
  { periode: "Februari 2026", gajiPokok: "Rp 5.850.000", tunjangan: "Rp 3.150.000", potongan: "Rp 1.230.000", gajiBersih: "Rp 7.770.000" },
  { periode: "Januari 2026", gajiPokok: "Rp 5.850.000", tunjangan: "Rp 3.100.000", potongan: "Rp 1.218.000", gajiBersih: "Rp 7.732.000" },
]

const attendanceSummary = {
  hadir: 21,
  izin: 1,
  sakit: 0,
  cuti: 0,
  alpha: 0,
  terlambat: 2,
  pulangCepat: 0,
}

const leaveBalance = {
  cutiTahunan: { total: 12, terpakai: 4, sisa: 8 },
  cutiBesar: { total: 3, terpakai: 0, sisa: 3 },
  cutiSakit: { total: 12, terpakai: 2, sisa: 10 },
}

const kpiSummary = {
  year: "2026",
  overallScore: 87.5,
  targets: [
    { name: "Uptime Sistem", target: 99.5, actual: 99.8, weight: 30 },
    { name: "Response Time", target: 2, actual: 1.5, weight: 25 },
    { name: "Project Completion", target: 100, actual: 95, weight: 25 },
    { name: "Team Development", target: 100, actual: 90, weight: 20 },
  ],
}

const trainingHistory = [
  { nama: "Leadership Management", penyelenggara: "LPP PDAM", tanggal: "10-12 Feb 2026", status: "Selesai", sertifikat: true },
  { nama: "Cyber Security Awareness", penyelenggara: "Kominfo", tanggal: "5 Jan 2026", status: "Selesai", sertifikat: true },
  { nama: "Project Management Professional", penyelenggara: "PMI", tanggal: "Mar 2025", status: "Selesai", sertifikat: true },
]

const documents = [
  { nama: "SK Pengangkatan CPNS", jenis: "SK", tanggal: "15 Jan 2010", status: "Valid" },
  { nama: "SK Pengangkatan PNS", jenis: "SK", tanggal: "15 Jan 2012", status: "Valid" },
  { nama: "Ijazah S2", jenis: "Ijazah", tanggal: "20 Sep 2012", status: "Valid" },
  { nama: "Sertifikat PMP", jenis: "Sertifikat", tanggal: "15 Mar 2025", status: "Aktif" },
  { nama: "BPJS Kesehatan", jenis: "Dokumen", tanggal: "01 Jan 2014", status: "Aktif" },
]

export default function EmployeeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState("profil")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Find employee from store
  const storeEmployee = pegawaiData.find(e => e.id === id) || pegawaiData[0]

  // Convert store format to detail page format if different
  const [employee, setEmployee] = useState({
    ...storeEmployee,
    name: storeEmployee.nama,
    noKtp: storeEmployee.nik, // Using nik as kpt for demo consistency
    pendidikanTerakhir: storeEmployee.pendidikan,
    usia: "39 tahun", // Placeholder
    atasanLangsung: "Ir. Joko Wibowo",
    bpjsKesehatan: storeEmployee.bpjsKes,
    bpjsKetenagakerjaan: storeEmployee.bpjsTK,
    tmt: storeEmployee.tanggalMasuk,
  })

  // Form state — pre-filled dari data pegawai
  const [formData, setFormData] = useState({ ...employee })

  const handleOpenEdit = () => {
    setFormData({ ...employee }) // reset form ke data terkini
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setEmployee({ ...formData })
    setShowEditDialog(false)
    setIsLoading(false)
    toast.success("Data pegawai berhasil diperbarui")
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kepegawaian", "Data Pegawai", employee.name]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/pegawai">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar Pegawai
              </Button>
            </Link>
          </div>

          {/* Profile Header */}
          <Card className="card-premium mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* Left - Avatar & Basic Info */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <Avatar className="h-28 w-28 shrink-0">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                      {employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusConfig[employee.status].className}
                        >
                          {statusConfig[employee.status].label}
                        </Badge>
                        {employee.sp === "SP1" && <Badge variant="outline" className={spConfig.SP1.className}>SP-1</Badge>}
                        {employee.sp === "SP2" && <Badge variant="outline" className={spConfig.SP2.className}>SP-2</Badge>}
                        {employee.sp === "SP3" && <Badge variant="outline" className={spConfig.SP3.className}>SP-3</Badge>}
                      </div>
                    </div>
                    <p className="mt-1 text-lg text-muted-foreground">{employee.jabatan}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        {employee.unitKerja}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        Golongan {employee.golongan}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {employee.masaKerja}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <a href={`mailto:${employee.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                        <Mail className="h-4 w-4" />
                        {employee.email}
                      </a>
                      <a href={`tel:${employee.telepon}`} className="flex items-center gap-1.5 text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        {employee.telepon}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right - Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download CV
                  </Button>
                  <Button size="sm" className="gap-2" onClick={handleOpenEdit}>
                    <Edit className="h-4 w-4" />
                    Edit Data
                  </Button>
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
                    <p className="font-medium">{employee.pendidikanTerakhir}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium">{employee.bank}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">BPJS Kesehatan</p>
                    <p className="font-medium">{employee.bpjsKesehatan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Atasan Langsung</p>
                    <p className="font-medium">{employee.atasanLangsung}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="profil" className="gap-2">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="keluarga" className="gap-2">
                <Users className="h-4 w-4" />
                Keluarga
              </TabsTrigger>
              <TabsTrigger value="pendidikan" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Pendidikan
              </TabsTrigger>
              <TabsTrigger value="jabatan" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Jabatan
              </TabsTrigger>
              <TabsTrigger value="pangkat" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Pangkat
              </TabsTrigger>
              <TabsTrigger value="gaji" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Gaji
              </TabsTrigger>
              <TabsTrigger value="absensi" className="gap-2">
                <Clock className="h-4 w-4" />
                Absensi
              </TabsTrigger>
              <TabsTrigger value="cuti" className="gap-2">
                <Calendar className="h-4 w-4" />
                Cuti
              </TabsTrigger>
              <TabsTrigger value="kinerja" className="gap-2">
                <Target className="h-4 w-4" />
                Kinerja
              </TabsTrigger>
              <TabsTrigger value="dokumen" className="gap-2">
                <FileText className="h-4 w-4" />
                Dokumen
              </TabsTrigger>
              <TabsTrigger value="pelatihan" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Pelatihan
              </TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-2">
                <History className="h-4 w-4" />
                Riwayat
              </TabsTrigger>
            </TabsList>

            {/* Profil Tab */}
            <TabsContent value="profil">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="text-base">Data Pribadi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">NIK</p>
                        <p className="font-mono font-medium">{employee.nik}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">No. KTP</p>
                        <p className="font-mono font-medium">{employee.noKtp}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tempat, Tanggal Lahir</p>
                        <p className="font-medium">{employee.tempatLahir}, {employee.tanggalLahir}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Usia</p>
                        <p className="font-medium">{employee.usia}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jenis Kelamin</p>
                        <p className="font-medium">{employee.jenisKelamin}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Agama</p>
                        <p className="font-medium">{employee.agama}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status Pernikahan</p>
                        <p className="font-medium">{employee.statusNikah}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">NPWP</p>
                        <p className="font-mono font-medium">{employee.npwp}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Alamat</p>
                      <p className="font-medium">{employee.alamat}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="text-base">Data Kepegawaian</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">TMT Kerja</p>
                        <p className="font-medium">{employee.tmt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Masa Kerja</p>
                        <p className="font-medium">{employee.masaKerja}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jabatan</p>
                        <p className="font-medium">{employee.jabatan}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unit Kerja</p>
                        <p className="font-medium">{employee.unitKerja}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Golongan</p>
                        <p className="font-medium">{employee.golongan}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Bank</p>
                        <p className="font-medium">{employee.bank}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">No. Rekening</p>
                        <p className="font-mono font-medium">{employee.noRekening}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">BPJS Kesehatan</p>
                        <p className="font-mono font-medium">{employee.bpjsKesehatan}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">BPJS Ketenagakerjaan</p>
                        <p className="font-mono font-medium">{employee.bpjsKetenagakerjaan}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Keluarga Tab */}
            <TabsContent value="keluarga">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Data Keluarga</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Hubungan</TableHead>
                        <TableHead>Tanggal Lahir</TableHead>
                        <TableHead>Pekerjaan</TableHead>
                        <TableHead>Tanggungan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {familyMembers.map((member, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{member.nama}</TableCell>
                          <TableCell>{member.hubungan}</TableCell>
                          <TableCell>{member.tanggalLahir}</TableCell>
                          <TableCell>{member.pekerjaan}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={member.statusTanggungan === "Ya" ? "bg-emerald-100 text-emerald-700" : ""}>
                              {member.statusTanggungan}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pendidikan Tab */}
            <TabsContent value="pendidikan">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Riwayat Pendidikan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenjang</TableHead>
                        <TableHead>Institusi</TableHead>
                        <TableHead>Jurusan</TableHead>
                        <TableHead>Tahun Lulus</TableHead>
                        <TableHead>IPK</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {educationHistory.map((edu, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{edu.jenjang}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{edu.institusi}</TableCell>
                          <TableCell>{edu.jurusan}</TableCell>
                          <TableCell>{edu.tahunLulus}</TableCell>
                          <TableCell className="font-mono">{edu.ipk}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Jabatan Tab */}
            <TabsContent value="jabatan">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Riwayat Jabatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>TMT Mulai</TableHead>
                        <TableHead>TMT Selesai</TableHead>
                        <TableHead>Nomor SK</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positionHistory.map((pos, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{pos.jabatan}</TableCell>
                          <TableCell>{pos.unitKerja}</TableCell>
                          <TableCell>{pos.tmtMulai}</TableCell>
                          <TableCell>
                            {pos.tmtSelesai === "Sekarang" ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                            ) : pos.tmtSelesai}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{pos.nomorSK}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pangkat Tab */}
            <TabsContent value="pangkat">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Riwayat Pangkat / Golongan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pangkat</TableHead>
                        <TableHead>Golongan</TableHead>
                        <TableHead>TMT Pangkat</TableHead>
                        <TableHead>Nomor SK</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankHistory.map((rank, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{rank.pangkat}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rank.golongan}</Badge>
                          </TableCell>
                          <TableCell>{rank.tmtPangkat}</TableCell>
                          <TableCell className="font-mono text-xs">{rank.nomorSK}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gaji Tab */}
            <TabsContent value="gaji">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Riwayat Gaji</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periode</TableHead>
                        <TableHead className="text-right">Gaji Pokok</TableHead>
                        <TableHead className="text-right">Tunjangan</TableHead>
                        <TableHead className="text-right">Potongan</TableHead>
                        <TableHead className="text-right">Gaji Bersih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryHistory.map((sal, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{sal.periode}</TableCell>
                          <TableCell className="text-right font-mono">{sal.gajiPokok}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">{sal.tunjangan}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{sal.potongan}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{sal.gajiBersih}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Absensi Tab */}
            <TabsContent value="absensi">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Rekap Absensi Bulan Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-emerald-50 p-4 text-center">
                      <p className="text-3xl font-bold text-emerald-600">{attendanceSummary.hadir}</p>
                      <p className="text-sm text-emerald-700">Hadir</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600">{attendanceSummary.izin}</p>
                      <p className="text-sm text-amber-700">Izin</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{attendanceSummary.sakit}</p>
                      <p className="text-sm text-blue-700">Sakit</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-4 text-center">
                      <p className="text-3xl font-bold text-red-600">{attendanceSummary.alpha}</p>
                      <p className="text-sm text-red-700">Alpha</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{attendanceSummary.terlambat}</p>
                      <p className="text-sm text-muted-foreground">Terlambat</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-muted-foreground">{attendanceSummary.pulangCepat}</p>
                      <p className="text-sm text-muted-foreground">Pulang Cepat</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{attendanceSummary.cuti}</p>
                      <p className="text-sm text-muted-foreground">Cuti</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cuti Tab */}
            <TabsContent value="cuti">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Saldo Cuti Tahun 2026</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">Cuti Tahunan</span>
                        <span className="text-sm text-muted-foreground">
                          {leaveBalance.cutiTahunan.terpakai} / {leaveBalance.cutiTahunan.total} hari terpakai
                        </span>
                      </div>
                      <Progress value={(leaveBalance.cutiTahunan.terpakai / leaveBalance.cutiTahunan.total) * 100} className="h-3" />
                      <p className="mt-1 text-sm text-emerald-600">Sisa: {leaveBalance.cutiTahunan.sisa} hari</p>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">Cuti Besar</span>
                        <span className="text-sm text-muted-foreground">
                          {leaveBalance.cutiBesar.terpakai} / {leaveBalance.cutiBesar.total} bulan terpakai
                        </span>
                      </div>
                      <Progress value={(leaveBalance.cutiBesar.terpakai / leaveBalance.cutiBesar.total) * 100} className="h-3" />
                      <p className="mt-1 text-sm text-emerald-600">Sisa: {leaveBalance.cutiBesar.sisa} bulan</p>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">Cuti Sakit</span>
                        <span className="text-sm text-muted-foreground">
                          {leaveBalance.cutiSakit.terpakai} / {leaveBalance.cutiSakit.total} hari terpakai
                        </span>
                      </div>
                      <Progress value={(leaveBalance.cutiSakit.terpakai / leaveBalance.cutiSakit.total) * 100} className="h-3" />
                      <p className="mt-1 text-sm text-emerald-600">Sisa: {leaveBalance.cutiSakit.sisa} hari</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kinerja Tab */}
            <TabsContent value="kinerja">
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">KPI Tahun {kpiSummary.year}</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Score: {kpiSummary.overallScore}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kpiSummary.targets.map((target, index) => (
                      <div key={index}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{target.name}</span>
                            <Badge variant="outline" className="text-xs">Bobot: {target.weight}%</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {target.actual} / {target.target}
                            </span>
                            {target.actual >= target.target ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                        </div>
                        <Progress value={(target.actual / target.target) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dokumen Tab */}
            <TabsContent value="dokumen">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Dokumen Kepegawaian</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Dokumen</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{doc.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.jenis}</Badge>
                          </TableCell>
                          <TableCell>{doc.tanggal}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700">{doc.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pelatihan Tab */}
            <TabsContent value="pelatihan">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Riwayat Pelatihan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Pelatihan</TableHead>
                        <TableHead>Penyelenggara</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sertifikat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingHistory.map((training, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{training.nama}</TableCell>
                          <TableCell>{training.penyelenggara}</TableCell>
                          <TableCell>{training.tanggal}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700">{training.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {training.sertifikat ? (
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Award className="h-4 w-4" />
                                Lihat
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Riwayat Tab */}
            <TabsContent value="riwayat">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">Log Aktivitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: "17 Mar 2026, 08:15", action: "Check-in absensi", detail: "Lokasi: Kantor Pusat" },
                      { date: "16 Mar 2026, 17:05", action: "Check-out absensi", detail: "Lokasi: Kantor Pusat" },
                      { date: "15 Mar 2026, 14:30", action: "Mengajukan cuti", detail: "Cuti tahunan 1 hari" },
                      { date: "14 Mar 2026, 10:00", action: "Approval lembur staff", detail: "Approved: Budi S." },
                      { date: "13 Mar 2026, 09:00", action: "Update data keluarga", detail: "Tambah data anak" },
                    ].map((log, index) => (
                      <div key={index} className="flex items-start gap-4 border-l-2 border-primary/20 pl-4">
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.detail}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Pegawai</DialogTitle>
            <DialogDescription>
              Perbarui data pegawai. Klik simpan setelah selesai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">

            {/* Nama */}
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                className="mt-1"
                value={formData.name}
                onChange={e => handleChange("name", e.target.value)}
              />
            </div>

            {/* NIK & No KTP */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>NIK (16 digit)</Label>
                <Input
                  className="mt-1 font-mono"
                  value={formData.noKtp}
                  onChange={e => handleChange("noKtp", e.target.value)}
                  maxLength={16}
                />
              </div>
              <div>
                <Label>NPWP</Label>
                <Input
                  className="mt-1 font-mono"
                  value={formData.npwp}
                  onChange={e => handleChange("npwp", e.target.value)}
                />
              </div>
            </div>

            {/* Jabatan & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jabatan</Label>
                <Input
                  className="mt-1"
                  value={formData.jabatan}
                  onChange={e => handleChange("jabatan", e.target.value)}
                />
              </div>
              <div>
                <Label>Unit Kerja</Label>
                <Select value={formData.unitKerja} onValueChange={v => handleChange("unitKerja", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT & Sistem">IT & Sistem</SelectItem>
                    <SelectItem value="Keuangan">Keuangan</SelectItem>
                    <SelectItem value="Distribusi">Distribusi</SelectItem>
                    <SelectItem value="Pelayanan">Pelayanan</SelectItem>
                    <SelectItem value="Produksi">Produksi</SelectItem>
                    <SelectItem value="SDM & Umum">SDM & Umum</SelectItem>
                    <SelectItem value="Direksi">Direksi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Golongan & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Golongan</Label>
                <Select value={formData.golongan} onValueChange={v => handleChange("golongan", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A/I","B/I","C/I","D/I","A/II","B/II","C/II","D/II",
                      "A/III","B/III","C/III","D/III","A/IV","B/IV","C/IV","D/IV","E/IV"].map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => handleChange("status", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="cuti">Cuti</SelectItem>
                    <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                    <SelectItem value="pensiun">Pensiun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SP Status */}
            <div>
              <Label>Surat Peringatan (SP)</Label>
              <Select value={formData.sp ?? "none"} onValueChange={v => handleChange("sp", v === "none" ? null : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Tidak ada SP" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada SP</SelectItem>
                  <SelectItem value="sp1">SP-1 (Peringatan Pertama)</SelectItem>
                  <SelectItem value="sp2">SP-2 (Peringatan Kedua)</SelectItem>
                  <SelectItem value="sp3">SP-3 (Peringatan Ketiga)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tempat Lahir</Label>
                <Input
                  className="mt-1"
                  value={formData.tempatLahir}
                  onChange={e => handleChange("tempatLahir", e.target.value)}
                />
              </div>
              <div>
                <Label>Tanggal Lahir</Label>
                <Input
                  className="mt-1"
                  value={formData.tanggalLahir}
                  onChange={e => handleChange("tanggalLahir", e.target.value)}
                />
              </div>
            </div>

            {/* Jenis Kelamin, Status Nikah, Agama */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Jenis Kelamin</Label>
                <Select value={formData.jenisKelamin} onValueChange={v => handleChange("jenisKelamin", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status Nikah</Label>
                <Select value={formData.statusNikah} onValueChange={v => handleChange("statusNikah", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                    <SelectItem value="Menikah">Menikah</SelectItem>
                    <SelectItem value="Cerai">Cerai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Agama</Label>
                <Select value={formData.agama} onValueChange={v => handleChange("agama", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Islam">Islam</SelectItem>
                    <SelectItem value="Kristen">Kristen</SelectItem>
                    <SelectItem value="Katolik">Katolik</SelectItem>
                    <SelectItem value="Hindu">Hindu</SelectItem>
                    <SelectItem value="Buddha">Buddha</SelectItem>
                    <SelectItem value="Konghucu">Konghucu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email & Telepon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  className="mt-1"
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input
                  className="mt-1"
                  value={formData.telepon}
                  onChange={e => handleChange("telepon", e.target.value)}
                />
              </div>
            </div>

            {/* Bank & Rekening */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank</Label>
                <Select value={formData.bank} onValueChange={v => handleChange("bank", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Mandiri">Bank Mandiri</SelectItem>
                    <SelectItem value="Bank BNI">Bank BNI</SelectItem>
                    <SelectItem value="Bank BRI">Bank BRI</SelectItem>
                    <SelectItem value="Bank BCA">Bank BCA</SelectItem>
                    <SelectItem value="Bank BTN">Bank BTN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>No. Rekening</Label>
                <Input
                  className="mt-1 font-mono"
                  value={formData.noRekening}
                  onChange={e => handleChange("noRekening", e.target.value)}
                />
              </div>
            </div>

            {/* BPJS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>BPJS Kesehatan</Label>
                <Input
                  className="mt-1 font-mono"
                  value={formData.bpjsKesehatan}
                  onChange={e => handleChange("bpjsKesehatan", e.target.value)}
                />
              </div>
              <div>
                <Label>BPJS Ketenagakerjaan</Label>
                <Input
                  className="mt-1 font-mono"
                  value={formData.bpjsKetenagakerjaan}
                  onChange={e => handleChange("bpjsKetenagakerjaan", e.target.value)}
                />
              </div>
            </div>

            {/* Pendidikan & Atasan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pendidikan Terakhir</Label>
                <Input
                  className="mt-1"
                  value={formData.pendidikanTerakhir}
                  onChange={e => handleChange("pendidikanTerakhir", e.target.value)}
                />
              </div>
              <div>
                <Label>Atasan Langsung</Label>
                <Input
                  className="mt-1"
                  value={formData.atasanLangsung}
                  onChange={e => handleChange("atasanLangsung", e.target.value)}
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <Label>Alamat</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={formData.alamat}
                onChange={e => handleChange("alamat", e.target.value)}
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
