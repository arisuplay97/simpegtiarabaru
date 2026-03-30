"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { useSession } from "next-auth/react"
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
  Trash2,
  UploadCloud,
  Plus,
  File,
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
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
import { Switch } from "@/components/ui/switch"
import { useParams } from "next/navigation"
import { getEmployee as getEmployeeBase, updateEmployee, uploadFotoPegawai, updateBebasAbsensi, updateLokasiPegawai } from "@/lib/actions/pegawai"
import { getEmployeeProfile } from "@/lib/actions/pegawai-detail"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getDokumenPegawai, uploadDokumen, deleteDokumen } from "@/lib/actions/dokumen"
import { getPegawaiActivityLogs } from "@/lib/actions/audit-log"
import { resetFaceData } from "@/lib/actions/face"
import { bidangList, getAtasanOtomatis, type TipeJabatan } from "@/lib/data/bidang-store"
import { Camera } from "lucide-react"

const statusConfig: Record<string, { label: string; className: string }> = {
  AKTIF: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CUTI: { label: "Cuti", className: "bg-amber-100 text-amber-700 border-amber-200" },
  NON_AKTIF: { label: "Non-Aktif", className: "bg-gray-100 text-gray-700 border-gray-200" },
  PENSIUN: { label: "Pensiun", className: "bg-red-100 text-red-700 border-red-200" },
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

// Ini akan diganti dengan state

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

function F({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
      {error && <p className="text-destructive text-[10px] mt-1">{error}</p>}
    </div>
  )
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const slug = params.slug as string
  const id = slug
  const [activeTab, setActiveTab] = useState("profil")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [employee, setEmployee] = useState<any>(null)
  const [lokasiList, setLokasiList] = useState<any[]>([])
  const [formData, setFormData] = useState<any>({})
  const [attendanceSummary, setAttendanceSummary] = useState<any>({
    hadir: 0, izin: 0, sakit: 0, cuti: 0, alpha: 0, terlambat: 0, pulangCepat: 0
  })

  // Dokumen State
  const [dokumenList, setDokumenList] = useState<any[]>([])
  const [showDocUpload, setShowDocUpload] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [docPayload, setDocPayload] = useState({ namaDokumen: "", jenisDokumen: "KTP", file: null as File | null })

  const [activityLogs, setActivityLogs] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      fetchEmployee()
      fetchLokasi()
    }
  }, [id])

  const fetchAttendanceSummary = async (pegawaiId: string) => {
    try {
      const res = await getEmployeeAttendanceSummary(pegawaiId)
      setAttendanceSummary(res)
    } catch (e) {}
  }

  const fetchLokasi = async () => {
    try {
      const res = await fetch("/api/lokasi")
      if (res.ok) {
        const data = await res.json()
        setLokasiList(data)
      }
    } catch (e) {}
  }

  const fetchEmployee = async () => {
    setIsLoading(true)
    try {
      const res = await getEmployeeProfile(id as string)
      if (!res) {
        toast.error("Pegawai tidak ditemukan")
      } else {
        // Reconstruct tipeJabatan for direktur because DB stores them as KEPALA_BIDANG
        if (res.tipeJabatan === "KEPALA_BIDANG" && res.user?.role === "DIREKSI") {
          const jab = (res.jabatan || "").toLowerCase()
          res.tipeJabatan = (jab.includes("utama") || jab.includes("dirut")) ? "direktur_utama" : "direktur"
        }

        setEmployee(res)
        fetchAttendanceSummary(res.id)
        fetchDokumen(res.id)
        fetchActivityLogs(res.id, res.userId)
        // Deteksi kategori (Pusat/Cabang) untuk initial state
        let kategoriPenempatan = "PUSAT"
        if (["KEPALA_CABANG", "KASUBBID_CABANG", "STAFF_CABANG"].includes(res.tipeJabatan)) {
          kategoriPenempatan = "CABANG"
        }

        setFormData({
          nik: res.nik,
          nama: res.nama,
          email: res.email,
          telepon: res.telepon,
          kategoriPenempatan: kategoriPenempatan,
          bidangId: res.bidangId || "",
          subBidangId: res.subBidangId || "",
          tipeJabatan: res.tipeJabatan || "",
          tipePegawai: res.kontrak?.[0]?.tipe || (res.tipeJabatan === "KONTRAK" ? "KONTRAK" : "TETAP"),
          jabatan: res.jabatan,
          atasanLangsung: res.atasanLangsung,
          golongan: res.golongan,
          pangkat: res.pangkat,
          status: res.status,
          sp: res.sp,
          tanggalMasuk: res.tanggalMasuk ? new Date(res.tanggalMasuk).toISOString().split("T")[0] : "",
          jenisKelamin: res.jenisKelamin,
          tempatLahir: res.tempatLahir,
          tanggalLahir: res.tanggalLahir ? new Date(res.tanggalLahir).toISOString().split("T")[0] : "",
          agama: res.agama,
          statusNikah: res.statusNikah,
          alamat: res.alamat,
          npwp: res.npwp,
          pendidikanTerakhir: res.pendidikanTerakhir,
          jurusan: res.jurusan,
          institusi: res.institusi,
          tahunLulus: res.tahunLulus,
          bank: res.bank,
          noRekening: res.noRekening,
          bpjsKesehatan: res.bpjsKesehatan,
          bpjsKetenagakerjaan: res.bpjsKetenagakerjaan,
        })
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat profil pegawai")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDokumen = async (pegawaiId: string) => {
    try {
      const res = await getDokumenPegawai(pegawaiId)
      if (res.data) setDokumenList(res.data)
    } catch {}
  }

  const fetchActivityLogs = async (pegawaiId: string, userId: string) => {
    try {
      const logs = await getPegawaiActivityLogs(pegawaiId, userId)
      setActivityLogs(logs)
    } catch {}
  }

  const handleUploadDokumenAction = async () => {
    if (!docPayload.namaDokumen || !docPayload.file) {
      toast.error("Nama dokumen dan file harus diisi")
      return
    }
    
    setIsUploadingDoc(true)
    toast.loading("Mengunggah dokumen...")
    try {
      const res = await uploadDokumen(employee.id, { 
        namaDokumen: docPayload.namaDokumen, 
        jenisDokumen: docPayload.jenisDokumen 
      }, docPayload.file)
      
      toast.dismiss()
      if (res.error) throw new Error(res.error)
      
      toast.success("Dokumen berhasil diunggah")
      setShowDocUpload(false)
      setDocPayload({ namaDokumen: "", jenisDokumen: "KTP", file: null })
      fetchDokumen(employee.id)
    } catch (e: any) {
      toast.dismiss()
      toast.error(e.message || "Gagal mengunggah dokumen")
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleDeleteDokumen = async (dokumenId: string) => {
    if (!confirm("Yakin ingin menghapus dokumen ini?")) return
    
    toast.loading("Menghapus dokumen...")
    try {
      const res = await deleteDokumen(dokumenId)
      toast.dismiss()
      if (res.error) throw new Error(res.error)
      
      toast.success("Dokumen berhasil dihapus")
      fetchDokumen(employee.id)
    } catch (e: any) {
      toast.dismiss()
      toast.error(e.message || "Gagal menghapus dokumen")
    }
  }

  const handleOpenEdit = () => {
    // FIX: hanya ambil field scalar — jangan spread seluruh employee object
    // karena employee mengandung nested relation (bidang, subBidang, kontrak, dll)
    // yang menyebabkan crash saat dikirim ke Prisma / updateEmployee
    if (!employee) return
    let kategoriPenempatan = "PUSAT"
    if (["KEPALA_CABANG", "KASUBBID_CABANG", "STAFF_CABANG"].includes(employee.tipeJabatan)) {
      kategoriPenempatan = "CABANG"
    }
    setFormData({
      nik: employee.nik,
      nama: employee.nama,
      email: employee.email,
      telepon: employee.telepon,
      kategoriPenempatan,
      bidangId: employee.bidangId || "",
      subBidangId: employee.subBidangId || "",
      tipeJabatan: employee.tipeJabatan || "",
      tipePegawai: employee.kontrak?.[0]?.tipe || (employee.tipeJabatan === "KONTRAK" ? "KONTRAK" : "TETAP"),
      jabatan: employee.jabatan,
      atasanLangsung: employee.atasanLangsung,
      golongan: employee.golongan,
      pangkat: employee.pangkat,
      status: employee.status,
      sp: employee.sp,
      tanggalMasuk: employee.tanggalMasuk ? new Date(employee.tanggalMasuk).toISOString().split("T")[0] : "",
      jenisKelamin: employee.jenisKelamin,
      tempatLahir: employee.tempatLahir,
      tanggalLahir: employee.tanggalLahir ? new Date(employee.tanggalLahir).toISOString().split("T")[0] : "",
      agama: employee.agama,
      statusNikah: employee.statusNikah,
      alamat: employee.alamat,
      npwp: employee.npwp,
      pendidikanTerakhir: employee.pendidikanTerakhir,
      jurusan: employee.jurusan,
      institusi: employee.institusi,
      tahunLulus: employee.tahunLulus,
      bank: employee.bank,
      noRekening: employee.noRekening,
      bpjsKesehatan: employee.bpjsKesehatan,
      bpjsKetenagakerjaan: employee.bpjsKetenagakerjaan,
    })
    setShowEditDialog(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    toast.loading("Mengupload foto...")
    try {
      const formData = new FormData()
      formData.append("pegawaiId", employee.id)
      formData.append("fotoFile", file)

      const res = await fetch("/api/pegawai/upload-foto", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Gagal upload")

      setEmployee((prev: any) => ({ ...prev, fotoUrl: json.url }))
      setPreviewUrl(json.url)
      toast.dismiss()
      toast.success("Foto berhasil diperbarui")
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || "Gagal mengunggah foto")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      await updateEmployee(employee.id, formData)
      await fetchEmployee()
      setShowEditDialog(false)
      toast.success("Data pegawai berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui data pegawai")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  // Hitung sisa pensiun (Umur 56)
  const getPensiunInfo = () => {
    if (!employee) return null

    const tipe = employee.tipeJabatan
    if (tipe === "KONTRAK" || tipe === "MAGANG") {
      // Cek apakah ada data kontrak aktif
      const kontrakAktif = (employee.kontrak || []).find((k: any) => k.status === "AKTIF")
      if (kontrakAktif) {
        const endDate = new Date(kontrakAktif.tanggalSelesai)
        const today = new Date()
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 0) {
          return { status: "Kontrak Berakhir", color: "text-red-700 bg-red-100", percentage: 100, tanggal: format(endDate, "dd MMMM yyyy", { locale: idLocale }) }
        }

        const startDate = new Date(kontrakAktif.tanggalMulai)
        const totalDuration = endDate.getTime() - startDate.getTime()
        const elapsedDuration = today.getTime() - startDate.getTime()
        const percentage = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100))

        const years = Math.floor(diffDays / 365)
        let sisaText = years > 0 ? `${years} Tahun ${diffDays % 365} Hari` : `${diffDays} Hari`

        let color = "text-emerald-700 bg-emerald-100"
        if (diffDays <= 30) color = "text-red-700 bg-red-100"
        else if (diffDays <= 90) color = "text-amber-700 bg-amber-100"

        return {
          tanggal: format(endDate, "dd MMMM yyyy", { locale: idLocale }),
          sisaText,
          color,
          percentage,
          label: kontrakAktif.tipe === "MAGANG" ? "Masa Magang" : "Masa Kontrak"
        }
      }
      // Tidak ada kontrak aktif
      return null
    }

    // Pegawai tetap — pensiun 56 tahun
    if (!employee.tanggalLahir || !employee.tanggalMasuk) return null
    const birthDate = new Date(employee.tanggalLahir)
    const pensiunDate = new Date(birthDate.getFullYear() + 56, birthDate.getMonth(), birthDate.getDate())
    const joinDate = new Date(employee.tanggalMasuk)
    const today = new Date()
    
    const diffTime = pensiunDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const totalDuration = pensiunDate.getTime() - joinDate.getTime()
    const elapsedDuration = today.getTime() - joinDate.getTime()
    const percentage = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100))

    if (diffDays <= 0) {
      return { status: "Sudah Pensiun", color: "text-red-700 bg-red-100", percentage: 100, label: "Masa Pensiun" }
    }
    
    const years = Math.floor(diffDays / 365)
    let sisaText = years > 0 ? `${years} Tahun ${diffDays % 365} Hari` : `${diffDays} Hari`
    
    let color = "text-emerald-700 bg-emerald-100"
    if (years <= 1) color = "text-red-700 bg-red-100"
    else if (years <= 5) color = "text-amber-700 bg-amber-100"

    return { 
      tanggal: format(pensiunDate, "dd MMMM yyyy", { locale: idLocale }),
      sisaText,
      color,
      percentage,
      label: "Masa Pensiun"
    }
  }

  // Real-time Atasan Calculation
  useEffect(() => {
    if (formData.bidangId && formData.tipeJabatan) {
      const atasan = getAtasanOtomatis(formData.tipeJabatan, formData.bidangId)
      if (atasan && atasan !== formData.atasanLangsung) {
        setFormData((prev: any) => ({ ...prev, atasanLangsung: atasan }))
      }
    }
  }, [formData.bidangId, formData.tipeJabatan])

  const pensiunInfo = getPensiunInfo()

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex min-h-screen bg-background">
        <SidebarNav />
        <div className="flex flex-1 flex-col sidebar-offset">
          <TopBar breadcrumb={["Kepegawaian", "Data Pegawai", "Not Found"]} />
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Pegawai Tidak Ditemukan</h1>
              <p className="mt-2 text-muted-foreground">ID pegawai tidak valid atau sudah dihapus.</p>
              <Button asChild className="mt-6"><Link href="/pegawai">Kembali ke Daftar</Link></Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Data Pegawai", employee?.nama]} />
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
                        <Camera className="h-3 w-3" /> Ganti Foto
                      </span>
                    </label>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-foreground">{employee.nama}</h1>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusConfig[employee.status || "AKTIF"]?.className || ""}
                        >
                          {statusConfig[employee.status || "AKTIF"]?.label || employee.status || "AKTIF"}
                        </Badge>
                        {employee.sp === "SP1" && <Badge variant="outline" className={spConfig.SP1.className}>SP-1</Badge>}
                        {employee.sp === "SP2" && <Badge variant="outline" className={spConfig.SP2.className}>SP-2</Badge>}
                        {employee.sp === "SP3" && <Badge variant="outline" className={spConfig.SP3.className}>SP-3</Badge>}
                      </div>
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
                        {employee.subBidang ? ` — ${employee.subBidang.nama}` : ""}
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

                {/* Right - Actions & Masa Pensiun */}
                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download CV
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleOpenEdit}>
                      <Edit className="h-4 w-4" />
                      Edit Data
                    </Button>
                  </div>
                  {pensiunInfo && (
                    <div className="w-64 mt-1 p-3 rounded-xl border border-primary/10 bg-card shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground mr-2">{pensiunInfo.label || "Masa Pensiun"}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${pensiunInfo.color}`}>
                          {pensiunInfo.status || `< ${pensiunInfo.sisaText}`} 
                        </span>
                      </div>
                      <Progress 
                        value={pensiunInfo.percentage} 
                        className="h-2 bg-secondary" 
                        indicatorClassName={pensiunInfo.color.includes('red') ? 'bg-red-500' : (pensiunInfo.color.includes('amber') ? 'bg-amber-500' : 'bg-emerald-500')} 
                      />
                      <span className="text-[10px] text-muted-foreground text-right">{pensiunInfo.tanggal ?? "-"}</span>
                    </div>
                  )}
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
                        <p className="text-xs text-muted-foreground">Tempat, Tanggal Lahir</p>
                        <p className="font-medium">{employee.tempatLahir || "-"}, {employee.tanggalLahir ? format(new Date(employee.tanggalLahir), "dd MMMM yyyy", { locale: idLocale }) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Usia</p>
                        <p className="font-medium">
                          {employee.tanggalLahir ? (() => {
                            const today = new Date()
                            const birth = new Date(employee.tanggalLahir)
                            let age = today.getFullYear() - birth.getFullYear()
                            const m = today.getMonth() - birth.getMonth()
                            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
                            return `${age} Tahun`
                          })() : "-"}
                        </p>
                      </div>
                      <div className="hidden">
                        {/* dipindahkan ke header kanan */}
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
                        <p className="text-xs text-muted-foreground">Tanggal Masuk Kerja</p>
                        <p className="font-medium" suppressHydrationWarning>{employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd/MM/yyyy") : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Masa Kerja</p>
                        <p className="font-medium">
                          {employee.tanggalMasuk ? (() => {
                            const start = new Date(employee.tanggalMasuk)
                            const now = new Date()
                            let years = now.getFullYear() - start.getFullYear()
                            let months = now.getMonth() - start.getMonth()
                            if (months < 0) { years--; months += 12 }
                            if (years === 0 && months === 0) return "Kurang dari 1 Bulan"
                            if (years === 0) return `${months} Bulan`
                            return `${years} Tahun ${months} Bulan`
                          })() : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jabatan</p>
                        <p className="font-medium">{employee.jabatan}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unit Kerja</p>
                        <p className="font-medium">{employee.bidang?.nama || "-"}</p>
                      </div>
                      {employee.tipeJabatan !== 'KONTRAK' && employee.tipeJabatan !== 'MAGANG' && (
                        <div>
                          <p className="text-xs text-muted-foreground">Golongan</p>
                          <p className="font-medium">{employee.golongan}</p>
                        </div>
                      )}
                      {employee.subBidang && (
                        <div>
                          <p className="text-xs text-muted-foreground">Sub Bidang / Seksi</p>
                          <p className="font-medium">{employee.subBidang.nama}</p>
                        </div>
                      )}
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

                    {/* ============ REVISI ABSENSI: FITUR 2 & 3 ============ */}
                    {(session?.user as any)?.role === "SUPERADMIN" && (
                      <div className="mt-6 space-y-4 border-t pt-6">
                        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                🔓 Absensi Bebas Lokasi
                              </p>
                              <p className="text-[11px] text-orange-700 mt-1 leading-relaxed">
                                Pegawai ini bisa absen dari lokasi manapun tanpa validasi GPS.
                                Gunakan hanya untuk pegawai yang sering bertugas di luar area.
                              </p>
                            </div>
                            <Switch
                              checked={employee.bebasAbsensi || false}
                              onCheckedChange={async (checked) => {
                                try {
                                  await updateBebasAbsensi(employee.id, checked)
                                  setEmployee((prev: any) => ({ ...prev, bebasAbsensi: checked }))
                                  toast.success(checked ? "Absensi bebas lokasi diaktifkan" : "Absensi bebas lokasi dinonaktifkan")
                                } catch (e: any) {
                                  toast.error(e.message)
                                }
                              }}
                            />
                          </div>
                        </div>

                        {!employee.bebasAbsensi && (
                          <div className="rounded-lg border p-4 bg-background">
                            <div className="mb-3">
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                📍 Binding Lokasi Absensi
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Batasi pegawai ini agar hanya bisa absen di satu lokasi tertentu.
                              </p>
                            </div>
                            <Select
                              value={employee.lokasiAbsensiId || "semua"}
                              onValueChange={async (val) => {
                                try {
                                  const lokasiId = val === "semua" ? null : val
                                  await updateLokasiPegawai(employee.id, lokasiId)
                                  setEmployee((prev: any) => ({ ...prev, lokasiAbsensiId: lokasiId }))
                                  toast.success("Lokasi absensi berhasil diperbarui")
                                } catch (e: any) {
                                  toast.error(e.message)
                                }
                              }}
                            >
                              <SelectTrigger className="w-full text-xs h-9">
                                <SelectValue placeholder="Pilih Lokasi..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="semua">🌐 Semua Lokasi Aktif (Default)</SelectItem>
                                {lokasiList.map((l: any) => (
                                  <SelectItem key={l.id} value={l.id}>
                                    {l.tipe === "kantor_pusat" ? "🏢" : "🏬"} {l.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Reset Verifikasi Wajah */}
                        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                🔄 Reset Verifikasi Wajah
                              </p>
                              <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                                Status: <span className={`font-bold ${employee.faceRegistered ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {employee.faceRegistered ? '✅ Wajah Terdaftar' : '❌ Belum Terdaftar'}
                                </span>
                                {employee.faceRegistered && ` · Gagal ${employee.faceFailCount || 0}x`}
                              </p>
                              <p className="text-[11px] text-red-600 mt-1">
                                Hapus data biometrik wajah. Pegawai harus daftar ulang di aplikasi mobile.
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={!employee.faceRegistered}
                              onClick={async () => {
                                if (!confirm(`Reset data wajah ${employee.nama}? Pegawai harus scan wajah ulang.`)) return
                                const res = await resetFaceData(employee.id)
                                if (res?.error) {
                                  toast.error(res.error)
                                } else {
                                  toast.success('Data wajah berhasil direset')
                                  setEmployee((prev: any) => ({ ...prev, faceRegistered: false, faceFailCount: 0 }))
                                }
                              }}
                            >
                              Reset Wajah
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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
                        <TableHead>Telepon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employee?.keluarga || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada data keluarga</TableCell></TableRow>
                      ) : (employee?.keluarga || []).map((member: any, index: number) => (
                        <TableRow key={member.id || index}>
                          <TableCell className="font-medium">{member.nama}</TableCell>
                          <TableCell>{member.hubungan}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{member.pekerjaan || "-"}</TableCell>
                          <TableCell>{member.telepon || "-"}</TableCell>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employee?.pendidikan || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada data pendidikan</TableCell></TableRow>
                      ) : (employee?.pendidikan || []).map((edu: any, index: number) => (
                        <TableRow key={edu.id || index}>
                          <TableCell>
                            <Badge variant="outline">{edu.tingkat}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{edu.institusi}</TableCell>
                          <TableCell>{edu.jurusan || "-"}</TableCell>
                          <TableCell>{edu.tahunLulus}</TableCell>
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
                      {(employee?.riwayatJabatan || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada data riwayat jabatan</TableCell></TableRow>
                      ) : (employee?.riwayatJabatan || []).map((pos: any, index: number) => (
                        <TableRow key={pos.id || index}>
                          <TableCell className="font-medium">{pos.jabatan}</TableCell>
                          <TableCell>{pos.unitDefinitif}</TableCell>
                          <TableCell>{pos.tanggalMulai ? new Date(pos.tanggalMulai).toLocaleDateString("id-ID") : "-"}</TableCell>
                          <TableCell>
                            {!pos.tanggalSelesai ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                            ) : new Date(pos.tanggalSelesai).toLocaleDateString("id-ID")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">-</TableCell>
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
                      {(employee?.riwayatPangkatDetail || []).length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">Belum ada data riwayat pangkat</TableCell></TableRow>
                      ) : (employee?.riwayatPangkatDetail || []).map((rank: any, index: number) => (
                        <TableRow key={rank.id || index}>
                          <TableCell className="font-medium">{rank.pangkat}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rank.golongan}</Badge>
                          </TableCell>
                          <TableCell>{rank.tanggalBerlaku ? new Date(rank.tanggalBerlaku).toLocaleDateString("id-ID") : "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{rank.nomorSK || "-"}</TableCell>
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
                      {(employee?.dokumen || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada dokumen</TableCell></TableRow>
                      ) : (employee?.dokumen || []).map((doc: any, index: number) => (
                        <TableRow key={doc.id || index}>
                          <TableCell className="font-medium">{doc.namaDokumen}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.jenisDokumen}</Badge>
                          </TableCell>
                          <TableCell>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("id-ID") : "-"}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700">Valid</Badge>
                          </TableCell>
                          <TableCell>
                            {doc.fileUrl ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dokumen Tab */}
            <TabsContent value="dokumen">
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Dokumen Kepegawaian
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Kelola arsip dan berkas pendukung milik {employee.nama}</p>
                  </div>
                  <Button size="sm" onClick={() => setShowDocUpload(true)} className="gap-2 shadow-sm shrink-0">
                    <Plus className="h-4 w-4" /> Tambah Dokumen
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="pl-6">Nama Dokumen</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Tanggal Upload</TableHead>
                        <TableHead className="text-right pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dokumenList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground border-b-0">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <File className="h-8 w-8 text-muted-foreground/50" />
                              <p>Belum ada dokumen yang diunggah</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        dokumenList.map((doc: any) => (
                          <TableRow key={doc.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                  <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <span className="line-clamp-1">{doc.namaDokumen}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-background">
                                {doc.jenisDokumen}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: idLocale })}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" asChild className="h-8 shadow-sm">
                                  <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                    <Download className="h-3.5 w-3.5 mr-1.5" /> Lihat/Unduh
                                  </a>
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-0 shadow-none"
                                  onClick={() => handleDeleteDokumen(doc.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
                      {(employee?.pelatihan || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada riwayat pelatihan</TableCell></TableRow>
                      ) : (employee?.pelatihan || []).map((training: any, index: number) => (
                        <TableRow key={training.id || index}>
                          <TableCell className="font-medium">{training.namaPelatihan}</TableCell>
                          <TableCell>{training.penyelenggara}</TableCell>
                          <TableCell>{training.tahun}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700">Selesai</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">-</span>
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
                    {activityLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6 italic">Belum ada riwayat aktivitas yang tercatat</p>
                    ) : activityLogs.map((log: any, index: number) => (
                      <div key={log.id || index} className="flex items-start gap-4 border-l-2 border-primary/20 pl-4">
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.module} — {log.targetName || "-"}
                            {log.oldData && " (Diubah)"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}</p>
                          <p className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={log.userAgent}>{log.userEmail}</p>
                        </div>
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-xl font-semibold">Edit Data Pegawai</DialogTitle>
          </DialogHeader>

          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              {/* Section 1: Foto + Nama + NIK */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30">
                    {previewUrl || formData.fotoUrl ? (
                      <AvatarImage src={previewUrl || formData.fotoUrl} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <span className="text-xs text-primary underline">{isUploading ? 'Mengunggah...' : 'Upload Foto'}</span>
                  </label>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="Nama Lengkap">
                    <Input value={formData.nama || ""} onChange={e => handleChange("nama", e.target.value)} placeholder="Nama Lengkap" />
                  </F>
                  <F label="NIK">
                    <Input value={formData.nik || ""} onChange={e => handleChange("nik", e.target.value)} placeholder="8 Digit NIK" maxLength={8} />
                  </F>
                  <F label="Email">
                    <Input value={formData.email || ""} onChange={e => handleChange("email", e.target.value)} placeholder="email@perusahaan.com" />
                  </F>
                  <F label="Telepon">
                    <Input value={formData.telepon || ""} onChange={e => handleChange("telepon", e.target.value)} placeholder="0812..." />
                  </F>
                </div>
              </div>

              <Separator />

              {/* Section 2: Kepegawaian */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Kepegawaian</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <F label="Tipe Pegawai">
                    <Select value={formData.tipePegawai || "TETAP"} onValueChange={v => {
                      handleChange("tipePegawai", v)
                      if (v !== "TETAP") {
                        handleChange("golongan", null)
                        handleChange("pangkat", null)
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Pilih Tipe Pegawai" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TETAP">Tetap / PDAM</SelectItem>
                        <SelectItem value="KONTRAK">Kontrak (PKWT)</SelectItem>
                        <SelectItem value="MAGANG">Magang</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Kategori Penempatan">
                    <Select value={formData.kategoriPenempatan || "PUSAT"} onValueChange={v => {
                      handleChange("kategoriPenempatan", v)
                      if (v === "PUSAT" && ["KEPALA_CABANG","KASUBBID_CABANG","STAFF_CABANG"].includes(formData.tipeJabatan || "")) {
                        handleChange("tipeJabatan", "STAFF")
                      } else if (v === "CABANG" && ["KEPALA_BIDANG","KASUBBID","STAFF"].includes(formData.tipeJabatan || "")) {
                        handleChange("tipeJabatan", "STAFF_CABANG")
                      }
                      handleChange("bidangId", "")
                      handleChange("subBidangId", "")
                      handleChange("jabatan", "")
                    }}>
                      <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUSAT">Pusat</SelectItem>
                        <SelectItem value="CABANG">Cabang</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Jabatan">
                    <Select value={formData.tipeJabatan || ""} onValueChange={v => {
                      handleChange("tipeJabatan", v)
                      // Auto-fill jabatan for direktur
                      if (v === "direktur_utama") handleChange("jabatan", "Direktur Utama")
                      else if (v === "direktur") handleChange("jabatan", "Direktur")
                      else handleChange("jabatan", "")
                    }}>
                      <SelectTrigger><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
                      <SelectContent>
                        {formData.kategoriPenempatan === "CABANG" ? (
                          <>
                            <SelectItem value="kepala_cabang">Kepala Cabang</SelectItem>
                            <SelectItem value="kasubbid_cabang">Ka. Sub Seksi Cabang</SelectItem>
                            <SelectItem value="staff_cabang">Staff Cabang</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="direktur_utama">⭐ Direktur Utama</SelectItem>
                            <SelectItem value="direktur">🔹 Direktur</SelectItem>
                            <SelectItem value="kepala_bidang">Kepala Bidang/Bagian</SelectItem>
                            <SelectItem value="kasubbid">Kasubbid / Kasi</SelectItem>
                            <SelectItem value="staff">Staff Pusat</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label={formData.kategoriPenempatan === "CABANG" ? "Pilih Cabang" : "Bidang / Bagian"}>
                    <Select value={formData.bidangId || "NONE"} onValueChange={v => {
                      const val = v === "NONE" ? "" : v
                      handleChange("bidangId", val)
                      handleChange("subBidangId", "")
                      handleChange("jabatan", "")
                    }}>
                      <SelectTrigger className="w-full truncate overflow-hidden [&>span]:truncate"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">— Pilih —</SelectItem>
                        {bidangList.filter(b => formData.kategoriPenempatan === "CABANG" ? b.nama.includes("Cabang") : !b.nama.includes("Cabang")).map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </F>

                  {(formData.tipeJabatan === "KASUBBID" || formData.tipeJabatan === "STAFF" || formData.tipeJabatan === "KASUBBID_CABANG" || formData.tipeJabatan === "STAFF_CABANG") && formData.bidangId && (
                    <F label="Sub Bidang / Seksi">
                      <Select value={formData.subBidangId || "NONE"} onValueChange={v => {
                        const val = v === "NONE" ? "" : v
                        handleChange("subBidangId", val)
                        handleChange("jabatan", "")
                      }}>
                        <SelectTrigger className="w-full truncate overflow-hidden [&>span]:truncate"><SelectValue placeholder="Pilih Sub Bidang" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">— Kosong (Langsung di bawah Bidang/Cabang) —</SelectItem>
                          {bidangList.find(b => b.id === formData.bidangId)?.subBidang?.map((sb: any) => (
                            <SelectItem key={sb.id} value={sb.id}>{sb.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </F>
                  )}

                  <F label="Jabatan Lengkap (Otomatis)">
                    <Input className="bg-muted" value={formData.jabatan || ""} readOnly disabled placeholder="Otomatis" />
                  </F>

                  {formData.tipePegawai === "TETAP" && (
                    <F label="Golongan PNS">
                      <Select value={formData.golongan || "NONE"} onValueChange={v => handleChange("golongan", v === "NONE" ? null : v)}>
                        <SelectTrigger><SelectValue placeholder="Pilih Golongan" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">— Pilih —</SelectItem>
                          {["A/I","A/II","A/III","A/IV","B/I","B/II","B/III","B/IV","C/I","C/II","C/III","C/IV","D/I","D/II","D/III","D/IV","E/IV"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </F>
                  )}
                  
                  <F label="Status Pegawai">
                    <Select value={formData.status || "AKTIF"} onValueChange={v => handleChange("status", v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AKTIF">Aktif</SelectItem>
                        <SelectItem value="CUTI">Cuti</SelectItem>
                        <SelectItem value="NON_AKTIF">Non-Aktif</SelectItem>
                        <SelectItem value="PENSIUN">Pensiun</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>

                  <F label="SP (Jika Ada)">
                    <Select value={formData.sp ?? "NONE"} onValueChange={v => handleChange("sp", v === "NONE" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Tidak Ada SP" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Tidak Ada</SelectItem>
                        <SelectItem value="SP1">SP 1</SelectItem>
                        <SelectItem value="SP2">SP 2</SelectItem>
                        <SelectItem value="SP3">SP 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                </div>
                {formData.atasanLangsung && formData.atasanLangsung !== "-" && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                    <span className="text-xs text-emerald-800 font-medium">✓ Atasan langsung otomatis: <strong>{formData.atasanLangsung}</strong></span>
                  </div>
                )}
              </section>

              <Separator />

              {/* Section 3: Data Pribadi */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Pribadi</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <F label="Tempat Lahir">
                    <Input value={formData.tempatLahir || ""} onChange={e => handleChange("tempatLahir", e.target.value)} placeholder="Kota Kelahiran" />
                  </F>
                  <F label="Tanggal Lahir">
                    <Input type="date" value={formData.tanggalLahir || ""} onChange={e => handleChange("tanggalLahir", e.target.value)} />
                  </F>
                  <F label="Jenis Kelamin">
                    <Select value={formData.jenisKelamin || "NONE"} onValueChange={v => handleChange("jenisKelamin", v === "NONE" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih JKL" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">— Pilih —</SelectItem>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Agama">
                    <Select value={formData.agama || "NONE"} onValueChange={v => handleChange("agama", v === "NONE" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih Agama" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">— Pilih —</SelectItem>
                        {["ISLAM","KRISTEN","KATOLIK","HINDU","BUDDHA","KONGHUCU"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Status Nikah">
                    <Select value={formData.statusNikah || "NONE"} onValueChange={v => handleChange("statusNikah", v === "NONE" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">— Pilih —</SelectItem>
                        <SelectItem value="BELUM_MENIKAH">Belum Menikah</SelectItem>
                        <SelectItem value="MENIKAH">Menikah</SelectItem>
                        <SelectItem value="CERAI">Cerai</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                </div>
                <div className="mt-4">
                  <F label="Alamat Domisili">
                    <Textarea value={formData.alamat || ""} onChange={e => handleChange("alamat", e.target.value)} placeholder="Alamat lengkap tempat tinggal saat ini" />
                  </F>
                </div>
              </section>

              <Separator />

              {/* Section 4: Pendidikan */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pendidikan Terakhir</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="Tingkat Pendidikan">
                    <Input value={formData.pendidikanTerakhir || ""} onChange={e => handleChange("pendidikanTerakhir", e.target.value)} placeholder="e.g. S1" />
                  </F>
                </div>
              </section>

              <Separator />

              {/* Section 5: Keuangan & Dokumen */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keuangan & Dokumen</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <F label="Bank">
                    <Select value={formData.bank || "NONE"} onValueChange={v => handleChange("bank", v === "NONE" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Pilih Bank" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">— Pilih Bank —</SelectItem>
                        {["Bank Mandiri", "Bank BNI", "Bank BRI", "Bank BCA", "Bank BTN", "Lainnya"].map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="No. Rekening">
                    <Input value={formData.noRekening || ""} onChange={e => handleChange("noRekening", e.target.value)} placeholder="000111222" />
                  </F>
                  <F label="NPWP">
                    <Input value={formData.npwp || ""} onChange={e => handleChange("npwp", e.target.value)} placeholder="NPWP" />
                  </F>
                  <F label="BPJS Kesehatan">
                    <Input value={formData.bpjsKesehatan || ""} onChange={e => handleChange("bpjsKesehatan", e.target.value)} placeholder="No. BPJS Kes" />
                  </F>
                  <F label="BPJS Ketenagakerjaan">
                    <Input value={formData.bpjsKetenagakerjaan || ""} onChange={e => handleChange("bpjsKetenagakerjaan", e.target.value)} placeholder="No. BPJS TK" />
                  </F>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dokumen Dialog */}
      <Dialog open={showDocUpload} onOpenChange={setShowDocUpload}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Dokumen Pegawai
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <F label="Nama Dokumen (Keterangan)">
              <Input 
                placeholder="e.g. Ijazah S1 Teknik Informatika" 
                value={docPayload.namaDokumen}
                onChange={e => setDocPayload(p => ({ ...p, namaDokumen: e.target.value }))}
              />
            </F>
            <F label="Jenis Dokumen">
              <Select value={docPayload.jenisDokumen} onValueChange={v => setDocPayload(p => ({ ...p, jenisDokumen: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                <SelectContent>
                  {["KTP", "KK", "Ijazah", "Transkrip Nilai", "SK Pangkat Terakhir", "SK Jabatan", "Sertifikat Pelatihan", "BPJS Kes", "BPJS TK", "NPWP", "Sertifikat Lainnya", "Lain-lain"].map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Pilih File Document (Max 5MB)">
              <div className="flex items-center gap-4 mt-1">
                <Button 
                  variant="outline" 
                  className="w-full relative overflow-hidden bg-muted/30 hover:bg-muted/50 border-dashed border-2 py-8"
                  type="button"
                >
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setDocPayload(p => ({ ...p, file }))
                      }} 
                    />
                    <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-foreground">
                      {docPayload.file ? docPayload.file.name : "Klik untuk memilih file"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOCX (Maks 5MB)</span>
                  </label>
                </Button>
              </div>
            </F>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => {
              setShowDocUpload(false)
              setDocPayload({ namaDokumen: "", jenisDokumen: "KTP", file: null })
            }}>Batal</Button>
            <Button onClick={handleUploadDokumenAction} disabled={isUploadingDoc || !docPayload.namaDokumen || !docPayload.file}>
              {isUploadingDoc ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengupload...</> : "Upload & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
