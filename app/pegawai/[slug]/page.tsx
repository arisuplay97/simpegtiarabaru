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
  Sparkles,
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
import { getLokasiList } from "@/lib/actions/lokasi"
import { bidangList, getAtasanOtomatis, type TipeJabatan } from "@/lib/data/bidang-store"
import { Camera } from "lucide-react"

const statusConfig: Record<string, { label: string; dot: string; className: string }> = {
  AKTIF: { label: "Aktif", dot: "bg-emerald-500", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  CUTI: { label: "Cuti", dot: "bg-amber-500", className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  NON_AKTIF: { label: "Non-Aktif", dot: "bg-slate-400", className: "border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300" },
  PENSIUN: { label: "Pensiun", dot: "bg-rose-500", className: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400" },
}

const spConfig: Record<string, { label: string; className: string }> = {
  SP1: { label: "SP-1", className: "border-slate-300 text-slate-600 dark:text-zinc-300 dark:border-zinc-700" },
  SP2: { label: "SP-2", className: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  SP3: { label: "SP-3", className: "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10" },
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
      const data = await getLokasiList()
      setLokasiList(data || [])
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
          let tj = "direktur"
          if (jab.includes("utama") || jab.includes("dirut")) tj = "direktur_utama"
          else if (jab.includes("operasional") || jab.includes("dirops")) tj = "direktur_operasional"
          else if (jab.includes("umum & keuangan") || jab.includes("umum dan keuangan") || jab.includes("dirum") || jab.includes("umum")) tj = "direktur_umum"
          res.tipeJabatan = tj as any
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

  const handleResetDevice = async () => {
    if (!confirm("Yakin ingin mereset Device ID? Pegawai harus login ulang di perangkat (HP) mereka.")) return
    toast.loading("Mereset binding device...")
    try {
      const res = await fetch(`/api/pegawai/${employee.id}/reset-device`, { method: "POST" })
      const json = await res.json()
      toast.dismiss()
      if (!res.ok) throw new Error(json.error)
      toast.success("Device ID berhasil direset")
    } catch (e: any) {
      toast.dismiss()
      toast.error(e.message || "Gagal mereset device ID")
    }
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

        let color = "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        if (diffDays <= 30) color = "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
        else if (diffDays <= 90) color = "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"

        return {
          tanggal: format(endDate, "dd MMMM yyyy", { locale: idLocale }),
          sisaText,
          color,
          percentage,
          label: kontrakAktif.tipe === "MAGANG" ? "Masa Magang" : "Masa Kontrak",
          targetYear: endDate.getFullYear(),
          yearsLeft: years,
          daysLeft: diffDays % 365,
          totalDays: diffDays
        }
      }
      // Tidak ada kontrak aktif
      return null
    }

    // Pegawai Direksi — masa jabatan 5 tahun dari tanggalMasuk
    const isDir = employee.user?.role === "DIREKSI" || 
      ["direktur_utama","direktur_operasional","direktur_umum","direktur"].includes((employee.tipeJabatan || "").toLowerCase())

    if (isDir) {
      if (!employee.tanggalMasuk) return null
      const joinDate = new Date(employee.tanggalMasuk)
      const endDate = new Date(joinDate.getFullYear() + 5, joinDate.getMonth(), joinDate.getDate())
      const today = new Date()
      const diffTime = endDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return { status: "Masa Jabatan Berakhir", color: "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400", percentage: 100, label: "Masa Jabatan", targetYear: endDate.getFullYear(), yearsLeft: 0, daysLeft: 0, totalDays: 0 }
      const totalDuration = endDate.getTime() - joinDate.getTime()
      const elapsed = today.getTime() - joinDate.getTime()
      const percentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
      const years = Math.floor(diffDays / 365)
      const sisaText = years > 0 ? `${years} Th ${diffDays % 365} Hr` : `${diffDays} Hari`
      const color = diffDays <= 180 ? "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400" : diffDays <= 365 ? "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      return { 
        tanggal: format(endDate, "dd MMMM yyyy", { locale: idLocale }), 
        sisaText, 
        color, 
        percentage, 
        label: "Masa Jabatan Direksi",
        targetYear: endDate.getFullYear(),
        yearsLeft: years,
        daysLeft: diffDays % 365,
        totalDays: diffDays
      }
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
      return { status: "Sudah Pensiun", color: "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400", percentage: 100, label: "Masa Pensiun", targetYear: pensiunDate.getFullYear(), yearsLeft: 0, daysLeft: 0, totalDays: 0 }
    }
    
    const years = Math.floor(diffDays / 365)
    let sisaText = years > 0 ? `${years} Tahun ${diffDays % 365} Hari` : `${diffDays} Hari`
    
    let color = "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    if (years <= 1) color = "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
    else if (years <= 5) color = "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"

    return { 
      tanggal: format(pensiunDate, "dd MMMM yyyy", { locale: idLocale }),
      sisaText,
      color,
      percentage,
      label: "Masa Pensiun",
      targetYear: pensiunDate.getFullYear(),
      yearsLeft: years,
      daysLeft: diffDays % 365,
      totalDays: diffDays
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
        <main className="flex-1 p-6 space-y-6">
          {/* Top Bar Navigation & Actions */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              href="/pegawai"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors px-3 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs w-fit"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Kembali ke Direktori Pegawai</span>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl"
                onClick={handleResetDevice}
              >
                <Shield className="h-3.5 w-3.5" strokeWidth={1.75} />
                Reset Device
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs border-slate-200 dark:border-zinc-800 rounded-xl"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                Unduh CV
              </Button>
              <Button
                size="sm"
                className="h-9 gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs rounded-xl font-medium"
                onClick={handleOpenEdit}
              >
                <Edit className="h-3.5 w-3.5" strokeWidth={1.75} />
                Edit Data Pegawai
              </Button>
            </div>
          </div>

          {/* Executive Profile Showcase Grid (Hero + Animated Masa Pensiun) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#111113]" />
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[employee.status || "AKTIF"]?.className || ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[employee.status || "AKTIF"]?.dot || "bg-emerald-500"}`} />
                        {statusConfig[employee.status || "AKTIF"]?.label || employee.status || "AKTIF"}
                      </span>
                      {employee.sp && spConfig[employee.sp as keyof typeof spConfig] && (
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-mono ${spConfig[employee.sp as keyof typeof spConfig].className}`}>
                          {spConfig[employee.sp as keyof typeof spConfig].label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mt-1">
                      {employee.jabatan} <span className="text-slate-400 font-normal">di</span> {employee.bidang?.nama || "Kantor Pusat"}{employee.subBidang ? ` — ${employee.subBidang.nama}` : ""}
                    </p>
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

              {/* Quick 4 Metrics Grid with elegant fallback */}
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

            {/* Right: The Showstopper Animated Masa Pensiun Card (4 cols) */}
            <div className="lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0A0D14] border border-slate-800 text-white p-6 shadow-xl flex flex-col justify-between">
              {/* Ambient Glows */}
              <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </div>
                    <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400">
                      {pensiunInfo?.label || "Masa Pensiun"}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md border border-slate-700 bg-slate-800/80 text-slate-300">
                    Target {pensiunInfo?.targetYear || "2055"}
                  </span>
                </div>

                {/* Sisa Pengabdian Big Numbers */}
                <div className="mt-5">
                  <p className="text-[11px] font-medium text-slate-400">Sisa Waktu Pengabdian</p>
                  <div className="mt-1">
                    <span className="text-3xl font-extrabold tracking-tight font-mono text-white drop-shadow-md">
                      {pensiunInfo?.sisaText || "—"}
                    </span>
                  </div>
                </div>

                {/* Animated Shimmer Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Perjalanan Karir</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {Math.round(pensiunInfo?.percentage || 0)}% Terlampaui
                    </span>
                  </div>
                  <div className="relative h-3 w-full rounded-full bg-slate-800/90 border border-slate-700/80 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 relative transition-all duration-1000"
                      style={{ width: `${Math.max(6, Math.min(100, pensiunInfo?.percentage || 0))}%` }}
                    >
                      {/* Shimmer light sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Milestones & Status */}
              <div className="mt-5 space-y-3">
                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">TMT Mulai</span>
                    <span className="font-mono text-[11px] text-slate-200 font-medium">
                      {employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd MMM yyyy", { locale: idLocale }) : "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Purna Tugas</span>
                    <span className="font-mono text-[11px] text-emerald-300 font-medium">
                      {pensiunInfo?.tanggal || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "8s" }} />
                    Fase Pengabdian Aktif
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Batas Usia: 56 Th
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full justify-start overflow-x-auto bg-slate-100/90 dark:bg-zinc-900/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 h-auto gap-1">
              <TabsTrigger value="profil" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                Profil
              </TabsTrigger>
              <TabsTrigger value="keluarga" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                Keluarga
              </TabsTrigger>
              <TabsTrigger value="pendidikan" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.75} />
                Pendidikan
              </TabsTrigger>
              <TabsTrigger value="jabatan" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
                Jabatan
              </TabsTrigger>
              <TabsTrigger value="pangkat" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                Pangkat
              </TabsTrigger>
              <TabsTrigger value="gaji" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
                Gaji
              </TabsTrigger>
              <TabsTrigger value="absensi" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                Absensi
              </TabsTrigger>
              <TabsTrigger value="cuti" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                Cuti
              </TabsTrigger>
              <TabsTrigger value="kinerja" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
                Kinerja
              </TabsTrigger>
              <TabsTrigger value="dokumen" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                Dokumen
              </TabsTrigger>
              <TabsTrigger value="pelatihan" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                Pelatihan
              </TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-1.5 text-xs rounded-xl py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xs font-medium">
                <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                Riwayat
              </TabsTrigger>
            </TabsList>

            {/* Profil Tab */}
            <TabsContent value="profil">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Data Pribadi Card */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300">
                        <User className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Data Pribadi</h3>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Identitas resmi pegawai sesuai dokumen kependudukan</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700">
                      Dukcapil
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/70 text-xs">
                    {[
                      { label: "Nomor Induk Karyawan (NIK)", value: employee.nik, mono: true },
                      { label: "Tempat, Tanggal Lahir", value: `${employee.tempatLahir || "—"}, ${employee.tanggalLahir ? format(new Date(employee.tanggalLahir), "dd MMMM yyyy", { locale: idLocale }) : "—"}` },
                      {
                        label: "Usia Saat Ini",
                        value: employee.tanggalLahir ? (() => {
                          const today = new Date()
                          const birth = new Date(employee.tanggalLahir)
                          let age = today.getFullYear() - birth.getFullYear()
                          const m = today.getMonth() - birth.getMonth()
                          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
                          return `${age} Tahun`
                        })() : null
                      },
                      { label: "Jenis Kelamin", value: employee.jenisKelamin === "L" ? "Laki-laki" : employee.jenisKelamin === "P" ? "Perempuan" : null },
                      { label: "Agama", value: employee.agama },
                      { label: "Status Pernikahan", value: employee.statusNikah },
                      { label: "Nomor Pokok Wajib Pajak (NPWP)", value: employee.npwp, mono: true },
                      { label: "Alamat Domisili Lengkap", value: employee.alamat },
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

                {/* Data Kepegawaian Card */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300">
                        <Briefcase className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Data Kepegawaian</h3>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Struktur penempatan kerja, jenjang kepangkatan, dan finansial</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                      SDM Aktif
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/70 text-xs">
                    {[
                      { label: "Tanggal Mulai Tugas (TMT)", value: employee.tanggalMasuk ? format(new Date(employee.tanggalMasuk), "dd MMMM yyyy", { locale: idLocale }) : null },
                      {
                        label: "Masa Pengabdian",
                        value: employee.tanggalMasuk ? (() => {
                          const start = new Date(employee.tanggalMasuk)
                          const now = new Date()
                          let years = now.getFullYear() - start.getFullYear()
                          let months = now.getMonth() - start.getMonth()
                          if (months < 0) { years--; months += 12 }
                          if (years === 0 && months === 0) return "Kurang dari 1 Bulan"
                          if (years === 0) return `${months} Bulan`
                          return `${years} Tahun ${months} Bulan`
                        })() : null
                      },
                      { label: "Jabatan Struktural", value: employee.jabatan },
                      { label: "Unit Kerja / Bidang", value: employee.bidang?.nama },
                      { label: "Sub Bidang / Seksi", value: employee.subBidang?.nama },
                      { label: "Golongan & Pangkat", value: `${employee.golongan || "—"} / ${employee.pangkat || "—"}` },
                      { label: "Rekening Bank Gaji", value: employee.bank ? `${employee.bank} - ${employee.noRekening || ""}` : null },
                      { label: "BPJS Kesehatan", value: employee.bpjsKesehatan, mono: true },
                      { label: "BPJS Ketenagakerjaan", value: employee.bpjsKetenagakerjaan, mono: true },
                    ].map(row => (
                      <div key={row.label} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="text-slate-500 dark:text-zinc-400 shrink-0 text-xs font-medium">{row.label}</span>
                        <span className={`text-right text-slate-900 dark:text-zinc-100 font-medium ${row.mono ? "font-mono" : ""}`}>
                          {row.value || <span className="text-slate-400 dark:text-zinc-600 italic font-normal">Belum diset</span>}
                        </span>
                      </div>
                    ))}
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
                  </div>
                </div>
              </TabsContent>

            {/* Keluarga Tab */}
            <TabsContent value="keluarga">
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
                              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border font-medium">Aktif</Badge>
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">KPI Tahun {kpiSummary.year}</CardTitle>
                    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border font-medium">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
                            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border font-medium">Valid</Badge>
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
                            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border font-medium">Selesai</Badge>
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
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
                {/* Helper: check if Direksi role (hide unneeded fields) */}
                {!(["direktur_utama","direktur_operasional","direktur_umum","direktur"].includes((formData.tipeJabatan || "").toLowerCase()) || bidangList.find(b => b.id === formData.bidangId)?.nama?.toLowerCase().includes("direksi")) && (
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
                )}
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
                      else if (v === "direktur_operasional") handleChange("jabatan", "Direktur Operasional")
                      else if (v === "direktur_umum") handleChange("jabatan", "Direktur Umum & Keuangan")
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
                            <SelectItem value="direktur_operasional">🔹 Direktur Operasional</SelectItem>
                            <SelectItem value="direktur_umum">🔹 Direktur Umum & Keuangan</SelectItem>
                            <SelectItem value="direktur">🔹 Direktur (Lainnya)</SelectItem>
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

                  {!(["direktur_utama","direktur_operasional","direktur_umum","direktur"].includes((formData.tipeJabatan || "").toLowerCase()) || bidangList.find(b => b.id === formData.bidangId)?.nama?.toLowerCase().includes("direksi")) && (
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

                  {!(["direktur_utama","direktur_operasional","direktur_umum","direktur"].includes((formData.tipeJabatan || "").toLowerCase()) || bidangList.find(b => b.id === formData.bidangId)?.nama?.toLowerCase().includes("direksi")) && (
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
                  )}
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
