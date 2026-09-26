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
  ScanFace,
  Globe,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  Camera,
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
import { getBidang, getEmployee as getEmployeeBase, updateEmployee, uploadFotoPegawai, updateBebasAbsensi, updateLokasiPegawai } from "@/lib/actions/pegawai"
import {
  getEmployeeProfile,
  addRiwayatJabatan,
  deleteRiwayatJabatan,
  addRiwayatPangkat,
  deleteRiwayatPangkat,
  addKeluarga,
  deleteKeluarga,
  addPendidikan,
  deletePendidikan,
  addPelatihan,
  deletePelatihan,
} from "@/lib/actions/pegawai-detail"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getDokumenPegawai, uploadDokumen, deleteDokumen } from "@/lib/actions/dokumen"
import { getPegawaiActivityLogs } from "@/lib/actions/audit-log"
import { resetFaceData } from "@/lib/actions/face"
import { getLokasiList } from "@/lib/actions/lokasi"
import { 
  getJabatanOptions, 
  getAtasanOtomatis, 
  getJabatanLabel, 
  getSubBidangOptions, 
  golonganOptions, 
  tipeKepegawaianOptions, 
  type TipeJabatan 
} from "@/lib/data/bidang-store"
import { daftarPangkat } from "@/lib/constants/pangkat"
import { generateCvPdf } from "@/lib/generate-cv-pdf"

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

function F({ label, children, error, required }: { label: string, children: React.ReactNode, error?: string, required?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
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
  const [bidangData, setBidangData] = useState<any[]>([])
  const [formTab, setFormTab] = useState<"identitas" | "kepegawaian" | "biodata" | "finansial">("identitas")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
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

  // State & Handlers: Input Manual Riwayat Jabatan
  const [showAddJabatan, setShowAddJabatan] = useState(false)
  const [jabatanForm, setJabatanForm] = useState({ jabatan: "", unitDefinitif: "", tanggalMulai: "", tanggalSelesai: "" })
  const [isSubmittingJabatan, setIsSubmittingJabatan] = useState(false)

  const handleAddJabatan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee?.id || !jabatanForm.jabatan || !jabatanForm.unitDefinitif || !jabatanForm.tanggalMulai) {
      toast.error("Mohon isi jabatan, unit kerja, dan tanggal mulai")
      return
    }
    setIsSubmittingJabatan(true)
    try {
      const res = await addRiwayatJabatan(employee.id, jabatanForm)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat jabatan berhasil ditambahkan")
      setShowAddJabatan(false)
      setJabatanForm({ jabatan: "", unitDefinitif: "", tanggalMulai: "", tanggalSelesai: "" })
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan riwayat jabatan")
    } finally {
      setIsSubmittingJabatan(false)
    }
  }

  const handleDeleteJabatan = async (itemJabatanId: string) => {
    if (!employee?.id) return
    if (!confirm("Hapus riwayat jabatan ini?")) return
    try {
      const res = await deleteRiwayatJabatan(itemJabatanId, employee.id)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat jabatan berhasil dihapus")
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus riwayat jabatan")
    }
  }

  // State & Handlers: Input Riwayat Pangkat
  const [showAddPangkat, setShowAddPangkat] = useState(false)
  const [isCustomPangkat, setIsCustomPangkat] = useState(false)
  const [pangkatForm, setPangkatForm] = useState({ pangkat: "Juru Muda", golongan: "A/I", tanggalBerlaku: "", nomorSK: "" })
  const [isSubmittingPangkat, setIsSubmittingPangkat] = useState(false)

  const handleOpenAddPangkat = () => {
    const curGol = employee?.golongan || "A/I"
    const found = daftarPangkat.find(p => p.golongan === curGol || p.aliasGolongan.includes(curGol))
    setPangkatForm({
      golongan: found ? found.golongan : curGol,
      pangkat: found ? found.nama : (employee?.pangkat || "Juru Muda"),
      tanggalBerlaku: "",
      nomorSK: ""
    })
    setIsCustomPangkat(false)
    setShowAddPangkat(true)
  }

  const handleGolonganChange = (selectedGol: string) => {
    const found = daftarPangkat.find(p => p.golongan === selectedGol || p.aliasGolongan.includes(selectedGol))
    setPangkatForm(f => ({
      ...f,
      golongan: selectedGol,
      pangkat: found ? found.nama : f.pangkat
    }))
  }

  const handlePangkatChange = (selectedNama: string) => {
    const found = daftarPangkat.find(p => p.nama === selectedNama)
    setPangkatForm(f => ({
      ...f,
      pangkat: selectedNama,
      golongan: found ? found.golongan : f.golongan
    }))
  }

  const handleAddPangkat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee?.id || !pangkatForm.pangkat || !pangkatForm.golongan || !pangkatForm.tanggalBerlaku) {
      toast.error("Mohon isi pangkat, golongan, dan tanggal berlaku")
      return
    }
    setIsSubmittingPangkat(true)
    try {
      const res = await addRiwayatPangkat(employee.id, pangkatForm)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat pangkat berhasil ditambahkan")
      setShowAddPangkat(false)
      setPangkatForm({ pangkat: "Juru Muda", golongan: "A/I", tanggalBerlaku: "", nomorSK: "" })
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan riwayat pangkat")
    } finally {
      setIsSubmittingPangkat(false)
    }
  }

  const handleDeletePangkat = async (itemPangkatId: string) => {
    if (!employee?.id) return
    if (!confirm("Hapus riwayat pangkat ini?")) return
    try {
      const res = await deleteRiwayatPangkat(itemPangkatId, employee.id)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat pangkat berhasil dihapus")
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus riwayat pangkat")
    }
  }

  // State & Handlers: Input Manual Data Keluarga
  const [showAddKeluarga, setShowAddKeluarga] = useState(false)
  const [keluargaForm, setKeluargaForm] = useState({ nama: "", hubungan: "Suami", pekerjaan: "", telepon: "" })
  const [isSubmittingKeluarga, setIsSubmittingKeluarga] = useState(false)

  const handleAddKeluarga = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee?.id || !keluargaForm.nama || !keluargaForm.hubungan) {
      toast.error("Mohon isi nama dan hubungan keluarga")
      return
    }
    setIsSubmittingKeluarga(true)
    try {
      const res = await addKeluarga(employee.id, keluargaForm)
      if (res?.error) throw new Error(res.error)
      toast.success("Data keluarga berhasil ditambahkan")
      setShowAddKeluarga(false)
      setKeluargaForm({ nama: "", hubungan: "Suami", pekerjaan: "", telepon: "" })
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan data keluarga")
    } finally {
      setIsSubmittingKeluarga(false)
    }
  }

  const handleDeleteKeluarga = async (itemKeluargaId: string) => {
    if (!employee?.id) return
    if (!confirm("Hapus data anggota keluarga ini?")) return
    try {
      const res = await deleteKeluarga(itemKeluargaId, employee.id)
      if (res?.error) throw new Error(res.error)
      toast.success("Data keluarga berhasil dihapus")
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data keluarga")
    }
  }

  // State & Handlers: Input Manual Riwayat Pendidikan
  const [showAddPendidikan, setShowAddPendidikan] = useState(false)
  const [pendidikanForm, setPendidikanForm] = useState({ tingkat: "S1", institusi: "", jurusan: "", tahunLulus: "" })
  const [isSubmittingPendidikan, setIsSubmittingPendidikan] = useState(false)

  const handleAddPendidikan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee?.id || !pendidikanForm.institusi || !pendidikanForm.tahunLulus) {
      toast.error("Mohon isi institusi dan tahun kelulusan")
      return
    }
    setIsSubmittingPendidikan(true)
    try {
      const res = await addPendidikan(employee.id, pendidikanForm)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat pendidikan berhasil ditambahkan")
      setShowAddPendidikan(false)
      setPendidikanForm({ tingkat: "S1", institusi: "", jurusan: "", tahunLulus: "" })
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan riwayat pendidikan")
    } finally {
      setIsSubmittingPendidikan(false)
    }
  }

  const handleDeletePendidikan = async (itemPendidikanId: string) => {
    if (!employee?.id) return
    if (!confirm("Hapus riwayat pendidikan ini?")) return
    try {
      const res = await deletePendidikan(itemPendidikanId, employee.id)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat pendidikan berhasil dihapus")
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus riwayat pendidikan")
    }
  }

  // State & Handlers: Input Manual Riwayat Pelatihan
  const [showAddPelatihan, setShowAddPelatihan] = useState(false)
  const [pelatihanForm, setPelatihanForm] = useState({ namaPelatihan: "", penyelenggara: "", tahun: "" })
  const [isSubmittingPelatihan, setIsSubmittingPelatihan] = useState(false)

  const handleAddPelatihan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee?.id || !pelatihanForm.namaPelatihan || !pelatihanForm.penyelenggara) {
      toast.error("Mohon isi nama pelatihan dan penyelenggara")
      return
    }
    setIsSubmittingPelatihan(true)
    try {
      const res = await addPelatihan(employee.id, pelatihanForm)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat pelatihan berhasil ditambahkan")
      setShowAddPelatihan(false)
      setPelatihanForm({ namaPelatihan: "", penyelenggara: "", tahun: "" })
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan riwayat pelatihan")
    } finally {
      setIsSubmittingPelatihan(false)
    }
  }

  const handleDeletePelatihan = async (itemPelatihanId: string) => {
    if (!employee?.id) return
    if (!confirm("Hapus riwayat pelatihan ini?")) return
    try {
      const res = await deletePelatihan(itemPelatihanId, employee.id)
      if (res?.error) throw new Error(res.error)
      toast.success("Riwayat pelatihan berhasil dihapus")
      await fetchEmployee()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus riwayat pelatihan")
    }
  }

  useEffect(() => {
    if (id) {
      fetchEmployee()
      fetchLokasi()
      getBidang().then(data => setBidangData(data || []))
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

  const [isGeneratingCv, setIsGeneratingCv] = useState(false)

  const handleDownloadCv = async () => {
    if (!employee) {
      toast.error("Data profil pegawai belum siap diunduh")
      return
    }
    setIsGeneratingCv(true)
    const toastId = toast.loading("Menyiapkan dokumen CV ATS PDF...")
    try {
      await generateCvPdf(employee)
      toast.success("CV ATS (PDF) berhasil diunduh!", { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Gagal mengunduh CV ATS", { id: toastId })
    } finally {
      setIsGeneratingCv(false)
    }
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
    if (!employee) return
    setFormData({
      nik: employee.nik || "",
      nama: employee.nama || "",
      email: employee.email || "",
      telepon: employee.telepon || "",
      fotoUrl: employee.fotoUrl || null,
      bidangId: employee.bidangId || "",
      subBidangId: employee.subBidangId || "",
      tipeJabatan: employee.tipeJabatan || "",
      jabatan: employee.jabatan || "",
      atasanLangsung: employee.atasanLangsung || "",
      golongan: employee.golongan || "",
      pangkat: employee.pangkat || "",
      status: employee.status || "AKTIF",
      sp: employee.sp || null,
      tanggalMasuk: employee.tanggalMasuk ? new Date(employee.tanggalMasuk).toISOString().split("T")[0] : "",
      jenisKelamin: employee.jenisKelamin || "",
      tempatLahir: employee.tempatLahir || "",
      tanggalLahir: employee.tanggalLahir ? new Date(employee.tanggalLahir).toISOString().split("T")[0] : "",
      agama: employee.agama || "",
      statusNikah: employee.statusNikah || "",
      pendidikanTerakhir: employee.pendidikanTerakhir || "",
      jurusan: employee.jurusan || "",
      institusi: employee.institusi || "",
      tahunLulus: employee.tahunLulus || "",
      bank: employee.bank || "",
      noRekening: employee.noRekening || "",
      bpjsKesehatan: employee.bpjsKesehatan || "",
      bpjsKetenagakerjaan: employee.bpjsKetenagakerjaan || "",
      alamat: employee.alamat || "",
      npwp: employee.npwp || "",
      tipeKepegawaian: (employee as any).tipeKepegawaian || (employee.tipeJabatan === "KONTRAK" ? "kontrak" : "tetap"),
    })
    setFotoPreview(employee.fotoUrl || null)
    setFotoFile(null)
    setFormErrors({})
    setFormTab("identitas")
    setShowEditDialog(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    toast.loading("Mengupload foto...")
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("pegawaiId", employee.id)
      formDataUpload.append("fotoFile", file)

      const res = await fetch("/api/pegawai/upload-foto", {
        method: "POST",
        body: formDataUpload,
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Gagal upload")

      setEmployee((prev: any) => ({ ...prev, fotoUrl: json.url }))
      setPreviewUrl(json.url)
      setFotoPreview(json.url)
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
    if (!employee?.id) return
    setIsSaving(true)
    try {
      const res = (await updateEmployee(employee.id, formData, fotoFile ?? undefined)) as any
      if (res?.error) {
        toast.error(res.error)
        setIsSaving(false)
        return
      }
      toast.success("Data pegawai berhasil diperbarui")
      setShowEditDialog(false)
      await fetchEmployee()
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui data pegawai")
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
        percentage: 100,
        label: "Masa Pensiun",
        targetYear: pensiunDate.getFullYear(),
        sisaText: "Purna Tugas",
        tanggal: format(pensiunDate, "dd MMM yyyy", { locale: idLocale }),
        yearsLeft: 0,
        daysLeft: 0,
        totalDays: 0,
      }
    }
    
    const years = Math.floor(diffDays / 365)
    const days = diffDays % 365
    let sisaText = years > 0 ? `${years} Tahun ${days} Hari` : `${diffDays} Hari`

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
                className="h-9 gap-1.5 text-xs border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                onClick={handleDownloadCv}
                disabled={isGeneratingCv || !employee}
                title="Unduh Curriculum Vitae (PDF)"
              >
                {isGeneratingCv ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                )}
                <span>{isGeneratingCv ? "Menyiapkan PDF..." : "Unduh CV"}</span>
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
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${statusConfig[employee.status || "AKTIF"]?.className || ""}`}>
                        <span className={`h-2 w-2 rounded-full ${statusConfig[employee.status || "AKTIF"]?.dot || "bg-emerald-500"}`} />
                        {statusConfig[employee.status || "AKTIF"]?.label || employee.status || "AKTIF"}
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

                    {/* ============ KEBIJAKAN & KEAMANAN PRESENSI (PREMIUM REVISION) ============ */}
                    {(session?.user as any)?.role === "SUPERADMIN" && (
                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              Kebijakan & Keamanan Presensi
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                              Konfigurasi pembatasan wilayah GPS dan otentikasi biometrik pegawai
                            </p>
                          </div>
                        </div>

                        {/* Card 1: Absensi Bebas Lokasi */}
                        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4.5 shadow-2xs transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50 shrink-0 mt-0.5">
                                <Shield className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                  Absensi Bebas Lokasi
                                </p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                  Pegawai dapat melakukan presensi dari lokasi manapun tanpa validasi koordinat GPS. Gunakan khusus untuk pegawai dinas luar atau penugasan lapangan.
                                </p>
                              </div>
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

                        {/* Card 2: Binding Lokasi Absensi */}
                        {!employee.bebasAbsensi && (
                          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4.5 shadow-2xs transition-colors">
                            <div className="flex items-start gap-3 mb-3.5">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 shrink-0 mt-0.5">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                  Binding Lokasi Penugasan
                                </p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                  Batasi presensi pegawai agar hanya dapat tervalidasi pada satu titik kantor atau cabang resmi yang ditentukan.
                                </p>
                              </div>
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
                              <SelectTrigger className="w-full text-xs h-9 bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100">
                                <SelectValue placeholder="Pilih Lokasi..." />
                              </SelectTrigger>
                              <SelectContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <SelectItem value="semua">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-blue-500" />
                                    <span>Semua Lokasi Aktif (Default)</span>
                                  </div>
                                </SelectItem>
                                {lokasiList.map((l: any) => (
                                  <SelectItem key={l.id} value={l.id}>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                                      <span>{l.nama}</span>
                                      {l.tipe === "kantor_pusat" && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-medium">
                                          Pusat
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Card 3: Reset Verifikasi Wajah */}
                        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4.5 shadow-2xs transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50 shrink-0 mt-0.5">
                                <ScanFace className="h-4 w-4" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                    Verifikasi Biometrik Wajah
                                  </p>
                                  {employee.faceRegistered ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                      Wajah Terdaftar
                                      {employee.faceFailCount > 0 && (
                                        <span className="text-slate-400 dark:text-zinc-500 font-mono">
                                          ({employee.faceFailCount}x gagal)
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
                                      Belum Terdaftar
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                  Hapus data biometrik jika pegawai mengalami kendala deteksi. Pegawai akan diminta mendaftarkan ulang wajah pada aplikasi mobile.
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!employee.faceRegistered}
                              className="border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold gap-1.5 shrink-0 self-start sm:self-center transition-colors disabled:opacity-40"
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
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset Data Wajah
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
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Data Keluarga</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Susunan anggota keluarga dan tanggungan pegawai</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddKeluarga(true)} className="h-8 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Anggota
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Hubungan</TableHead>
                        <TableHead>Pekerjaan</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead className="w-[60px] text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employee?.keluarga || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada data keluarga</TableCell></TableRow>
                      ) : (employee?.keluarga || []).map((member: any, index: number) => (
                        <TableRow key={member.id || index}>
                          <TableCell className="font-medium">{member.nama}</TableCell>
                          <TableCell>{member.hubungan}</TableCell>
                          <TableCell>{member.pekerjaan || "-"}</TableCell>
                          <TableCell>{member.telepon || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => handleDeleteKeluarga(member.id)}
                              title="Hapus data keluarga"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
              <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Riwayat Pendidikan Formal</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Jenjang pendidikan, institusi, dan tahun kelulusan</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddPendidikan(true)} className="h-8 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Pendidikan
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenjang</TableHead>
                        <TableHead>Institusi</TableHead>
                        <TableHead>Jurusan</TableHead>
                        <TableHead>Tahun Lulus</TableHead>
                        <TableHead className="w-[60px] text-right">Aksi</TableHead>
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => handleDeletePendidikan(edu.id)}
                              title="Hapus riwayat pendidikan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
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
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Riwayat Jabatan</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Rekam jejak posisi struktural/fungsional, penempatan unit, dan mutasi</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddJabatan(true)} className="h-8 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Riwayat Jabatan
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Unit Kerja / Penempatan</TableHead>
                        <TableHead>TMT Mulai</TableHead>
                        <TableHead>TMT Selesai</TableHead>
                        <TableHead className="w-[60px] text-right">Aksi</TableHead>
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => handleDeleteJabatan(pos.id)}
                              title="Hapus riwayat jabatan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
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
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Riwayat Pangkat & Golongan</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Histori kepangkatan, golongan ruang, dan penetapan SK</p>
                  </div>
                  <Button size="sm" onClick={handleOpenAddPangkat} className="h-8 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Riwayat Pangkat
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pangkat</TableHead>
                        <TableHead>Golongan</TableHead>
                        <TableHead>TMT Berlaku</TableHead>
                        <TableHead>Nomor SK</TableHead>
                        <TableHead className="w-[60px] text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employee?.riwayatPangkatDetail || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">Belum ada data riwayat pangkat</TableCell></TableRow>
                      ) : (employee?.riwayatPangkatDetail || []).map((rank: any, index: number) => (
                        <TableRow key={rank.id || index}>
                          <TableCell className="font-medium">{rank.pangkat}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rank.golongan}</Badge>
                          </TableCell>
                          <TableCell>{rank.tanggalBerlaku ? new Date(rank.tanggalBerlaku).toLocaleDateString("id-ID") : "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{rank.nomorSK || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => handleDeletePangkat(rank.id)}
                              title="Hapus riwayat pangkat"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
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
              {(() => {
                const curYear = 2026
                const cutiList = (employee?.cuti || [])
                const cutiTahunIni = cutiList.filter((c: any) => {
                  const y = new Date(c.tanggalMulai).getFullYear()
                  return y === curYear
                })

                let terpakaiTahunan = 0
                let terpakaiBesarHari = 0
                let terpakaiSakit = 0

                cutiTahunIni.forEach((c: any) => {
                  const start = new Date(c.tanggalMulai)
                  const end = new Date(c.tanggalSelesai)
                  const durasi = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                  const jenis = (c.jenisCuti || "").toLowerCase()

                  if (jenis.includes("tahunan")) {
                    terpakaiTahunan += durasi
                  } else if (jenis.includes("besar")) {
                    terpakaiBesarHari += durasi
                  } else if (jenis.includes("sakit")) {
                    terpakaiSakit += durasi
                  }
                })

                const sisaTahunan = employee?.saldoCuti !== undefined ? Number(employee.saldoCuti) : Math.max(0, 12 - terpakaiTahunan)
                const totalTahunan = Math.max(12, sisaTahunan + terpakaiTahunan)
                const progressTahunan = totalTahunan > 0 ? Math.min(100, (terpakaiTahunan / totalTahunan) * 100) : 0

                const totalBesarBulan = 3
                const terpakaiBesarBulan = Math.min(3, Math.round((terpakaiBesarHari / 30) * 10) / 10)
                const sisaBesarBulan = Math.max(0, totalBesarBulan - terpakaiBesarBulan)
                const progressBesar = Math.min(100, (terpakaiBesarBulan / totalBesarBulan) * 100)

                return (
                  <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div>
                        <CardTitle className="text-base font-bold">Saldo & Hak Cuti Pegawai</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Tahun Periode {curYear}</p>
                      </div>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
                        {cutiTahunIni.length} Pengajuan Approved
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                      {/* Cuti Tahunan */}
                      <div className="p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-900 dark:text-zinc-100">Cuti Tahunan</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
                            {terpakaiTahunan} / {totalTahunan} hari terpakai
                          </span>
                        </div>
                        <Progress value={progressTahunan} className="h-2.5 bg-slate-200 dark:bg-zinc-800" />
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Sisa: {sisaTahunan} hari
                          </p>
                          <span className="text-[11px] text-muted-foreground">Kuota Tahunan: {totalTahunan} hari</span>
                        </div>
                      </div>

                      {/* Cuti Besar */}
                      <div className="p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-900 dark:text-zinc-100">Cuti Besar</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
                            {terpakaiBesarBulan} / {totalBesarBulan} bulan terpakai
                          </span>
                        </div>
                        <Progress value={progressBesar} className="h-2.5 bg-slate-200 dark:bg-zinc-800" />
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Sisa: {sisaBesarBulan} bulan
                          </p>
                          <span className="text-[11px] text-muted-foreground">Hak Berkala 5 Tahun</span>
                        </div>
                      </div>

                      {/* Cuti Sakit: Bebas Kuota / Surat Dokter, TANPA batas sisa saldo */}
                      <div className="p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-zinc-100">Cuti Sakit</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                              Surat Keterangan Dokter
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                            {terpakaiSakit} hari terpakai
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          Cuti sakit tidak memiliki batas kuota saldo tahunan (tanpa sisa saldo). Diberikan sesuai masa istirahat medis pada Surat Keterangan Dokter yang sah dan tidak memotong kuota Cuti Tahunan.
                        </p>
                      </div>

                      {/* Riwayat Cuti Approved */}
                      {cutiTahunIni.length > 0 && (
                        <div className="pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Riwayat Permohonan Cuti Disetujui ({curYear})
                          </h4>
                          <div className="space-y-2">
                            {cutiTahunIni.map((c: any) => {
                              const sDate = new Date(c.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                              const eDate = new Date(c.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                              const dur = Math.max(1, Math.ceil((new Date(c.tanggalSelesai).getTime() - new Date(c.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                              return (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/60 text-xs">
                                  <div className="min-w-0 pr-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{c.jenisCuti}</span>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">Disetujui</Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.alasan || "-"}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{dur} Hari</span>
                                    <p className="text-[10px] text-muted-foreground">{sDate} - {eDate}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })()}
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
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">Riwayat Pelatihan & Sertifikasi</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Diklat teknis, kursus, dan sertifikasi profesi yang pernah diikuti</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddPelatihan(true)} className="h-8 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Pelatihan
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Pelatihan</TableHead>
                        <TableHead>Penyelenggara</TableHead>
                        <TableHead>Tahun</TableHead>
                        <TableHead className="w-[60px] text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employee?.pelatihan || []).length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">Belum ada riwayat pelatihan</TableCell></TableRow>
                      ) : (employee?.pelatihan || []).map((training: any, index: number) => (
                        <TableRow key={training.id || index}>
                          <TableCell className="font-medium">{training.namaPelatihan}</TableCell>
                          <TableCell>{training.penyelenggara}</TableCell>
                          <TableCell>{training.tahun}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => handleDeletePelatihan(training.id)}
                              title="Hapus riwayat pelatihan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" strokeWidth={1.75} />
              Perbarui Data Pegawai - {employee?.nama}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Perbarui identitas, kepegawaian, biodata, dan dokumen finansial pegawai.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="space-y-5">
              {/* Tab Selector Buttons */}
              <div className="flex border-b border-slate-200 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setFormTab("identitas")}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    formTab === "identitas"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Identitas & Akun
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab("kepegawaian")}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    formTab === "kepegawaian"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Kepegawaian & Jabatan
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab("biodata")}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    formTab === "biodata"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Biodata & Domisili
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab("finansial")}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    formTab === "finansial"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Pendidikan & Finansial
                </button>
              </div>

              {/* Tab 1: Identitas & Akun */}
              {formTab === "identitas" && (
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                    <div className="relative group shrink-0">
                      <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center shadow-xs">
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-8 w-8 text-slate-400 dark:text-zinc-500" strokeWidth={1.5} />
                        )}
                      </div>
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-medium">
                        <Camera className="h-4 w-4 mb-0.5" />
                        Ubah
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setFotoFile(file)
                              setFotoPreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Foto Profil Pegawai</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Format PNG atau JPG dengan ukuran maksimal 2MB. Foto formal tampak depan dengan pencahayaan memadai.
                      </p>
                      <label className="inline-block text-xs font-medium text-primary hover:underline cursor-pointer mt-1">
                        Pilih Berkas Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setFotoFile(file)
                              setFotoPreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <F label="Nama Lengkap" error={formErrors.nama} required>
                      <Input
                        value={formData.nama || ""}
                        onChange={e => handleChange("nama", e.target.value)}
                        placeholder="Contoh: Muhammad Ihsan, S.T."
                        className="h-9 text-xs"
                      />
                    </F>
                    <F label="NIK (Nomor Induk Karyawan)" error={formErrors.nik} required>
                      <Input
                        value={formData.nik || ""}
                        onChange={e => handleChange("nik", e.target.value.replace(/\D/g, "").slice(0, 18))}
                        placeholder="7 - 8 digit angka (contoh: 2002136)"
                        maxLength={18}
                        className="h-9 text-xs font-mono"
                      />
                    </F>
                    <F label="Email Perusahaan" error={formErrors.email} required>
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={e => handleChange("email", e.target.value)}
                        placeholder="nama@pdam-tar.co.id"
                        className="h-9 text-xs"
                      />
                    </F>
                    <F label="Nomor Telepon / WhatsApp" error={formErrors.telepon}>
                      <Input
                        value={formData.telepon || ""}
                        onChange={e => handleChange("telepon", e.target.value)}
                        placeholder="081234567890"
                        className="h-9 text-xs font-mono"
                      />
                    </F>
                  </div>
                </div>
              )}

              {/* Tab 2: Kepegawaian & Jabatan */}
              {formTab === "kepegawaian" && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <F label="Unit Kerja / Bidang" error={formErrors.bidangId} required>
                      <Select
                        value={formData.bidangId || "NONE"}
                        onValueChange={v => {
                          const bid = v === "NONE" ? "" : v
                          handleChange("bidangId", bid)
                          handleChange("subBidangId", "")
                          handleChange("tipeJabatan", "")
                          handleChange("jabatan", "")
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs truncate overflow-hidden">
                          <SelectValue placeholder="Pilih Unit Kerja" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">— Pilih Unit Kerja —</SelectItem>
                          {bidangData.map(b => (
                            <SelectItem key={b.id} value={b.id} className="text-xs">
                              {b.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </F>

                    <F label="Jabatan Struktural" required>
                      <Select
                        value={formData.tipeJabatan || "NONE"}
                        onValueChange={v => {
                          const tipe = v === "NONE" ? "" : v
                          const bidang = bidangData.find(b => b.id === formData.bidangId)
                          const namaB = bidang?.nama || ""
                          const autoJabatan = tipe ? getJabatanLabel(tipe as TipeJabatan, namaB) : ""
                          handleChange("tipeJabatan", tipe)
                          handleChange("jabatan", autoJabatan)
                          if (tipe.includes("kepala")) {
                            handleChange("subBidangId", "")
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs truncate overflow-hidden">
                          <SelectValue placeholder="Pilih Jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">— Pilih Jabatan —</SelectItem>
                          {formData.bidangId ? (
                            getJabatanOptions(formData.bidangId, bidangData).map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="kepala_bidang" className="text-xs">Kepala Bidang</SelectItem>
                              <SelectItem value="kasubbid" className="text-xs">Kasubbid</SelectItem>
                              <SelectItem value="staf_ahli" className="text-xs">Staf Ahli</SelectItem>
                              <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                              <SelectItem value="kepala_cabang" className="text-xs">Kepala Cabang</SelectItem>
                              <SelectItem value="kasubbid_cabang" className="text-xs">Kasubbid Cabang</SelectItem>
                              <SelectItem value="staff_cabang" className="text-xs">Staff Cabang</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </F>

                    {formData.tipeJabatan && !formData.tipeJabatan.includes("kepala") && formData.bidangId && (
                      <F label="Sub Bidang" error={formErrors.subBidangId} required>
                        <Select
                          value={formData.subBidangId || "NONE"}
                          onValueChange={v => handleChange("subBidangId", v === "NONE" ? "" : v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Sub Bidang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">— Pilih Sub Bidang —</SelectItem>
                            {getSubBidangOptions(formData.bidangId || "", bidangData).map(sb => (
                              <SelectItem key={sb.id} value={sb.id} className="text-xs">
                                {sb.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </F>
                    )}

                    <F label="Tipe Kepegawaian">
                      <Select
                        value={formData.tipeKepegawaian || "tetap"}
                        onValueChange={v => handleChange("tipeKepegawaian", v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Tipe Kepegawaian" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipeKepegawaianOptions.map(t => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </F>

                    {formData.tipeKepegawaian !== "kontrak" && formData.tipeKepegawaian !== "magang" && (
                      <F label="Golongan" error={formErrors.golongan} required>
                        <Select
                          value={formData.golongan || "NONE"}
                          onValueChange={v => handleChange("golongan", v === "NONE" ? "" : v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Golongan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">— Pilih Golongan —</SelectItem>
                            {golonganOptions.map(g => (
                              <SelectItem key={g} value={g} className="text-xs font-mono">
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </F>
                    )}

                    <F label="Status Kepegawaian">
                      <Select value={formData.status || "AKTIF"} onValueChange={v => handleChange("status", v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                          <SelectItem value="CUTI" className="text-xs">Cuti</SelectItem>
                          <SelectItem value="NON_AKTIF" className="text-xs">Non-Aktif</SelectItem>
                          <SelectItem value="PENSIUN" className="text-xs">Pensiun</SelectItem>
                        </SelectContent>
                      </Select>
                    </F>

                    <F label="Tanggal Mulai Tugas (TMT)">
                      <Input
                        type="date"
                        value={formData.tanggalMasuk || ""}
                        onChange={e => handleChange("tanggalMasuk", e.target.value)}
                        className="h-9 text-xs"
                      />
                    </F>

                    <F label="Surat Peringatan (SP)">
                      <Select
                        value={formData.sp ?? "NONE"}
                        onValueChange={v => handleChange("sp", v === "NONE" ? null : v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Tidak Ada SP" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE" className="text-xs">Tidak Ada SP</SelectItem>
                          <SelectItem value="SP1" className="text-xs">SP 1</SelectItem>
                          <SelectItem value="SP2" className="text-xs">SP 2</SelectItem>
                          <SelectItem value="SP3" className="text-xs">SP 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </F>
                  </div>

                  {(formData.tipeJabatan as TipeJabatan) && formData.bidangId && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 text-xs">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Atasan Langsung Otomatis:{" "}
                        <strong className="font-semibold">
                          {getAtasanOtomatis(formData.tipeJabatan as TipeJabatan, formData.bidangId || "", bidangData)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Biodata & Domisili */}
              {formTab === "biodata" && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <F label="Tempat Lahir">
                      <Input
                        value={formData.tempatLahir || ""}
                        onChange={e => handleChange("tempatLahir", e.target.value)}
                        placeholder="Contoh: Praya, Mataram"
                        className="h-9 text-xs"
                      />
                    </F>
                    <F label="Tanggal Lahir">
                      <Input
                        type="date"
                        value={formData.tanggalLahir || ""}
                        onChange={e => handleChange("tanggalLahir", e.target.value)}
                        className="h-9 text-xs"
                      />
                    </F>
                    <F label="Jenis Kelamin">
                      <Select value={formData.jenisKelamin || ""} onValueChange={v => handleChange("jenisKelamin", v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L" className="text-xs">Laki-laki</SelectItem>
                          <SelectItem value="P" className="text-xs">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </F>
                    <F label="Agama">
                      <Select value={formData.agama || ""} onValueChange={v => handleChange("agama", v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Agama" />
                        </SelectTrigger>
                        <SelectContent>
                          {["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"].map(a => (
                            <SelectItem key={a} value={a} className="text-xs">
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </F>
                    <F label="Status Pernikahan">
                      <Select value={formData.statusNikah || ""} onValueChange={v => handleChange("statusNikah", v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Status Nikah" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BELUM_MENIKAH" className="text-xs">Belum Menikah</SelectItem>
                          <SelectItem value="MENIKAH" className="text-xs">Menikah</SelectItem>
                          <SelectItem value="CERAI" className="text-xs">Cerai</SelectItem>
                        </SelectContent>
                      </Select>
                    </F>
                    <F label="Nomor Pokok Wajib Pajak (NPWP)">
                      <Input
                        value={formData.npwp || ""}
                        onChange={e => handleChange("npwp", e.target.value)}
                        placeholder="00.000.000.0-000.000"
                        className="h-9 text-xs font-mono"
                      />
                    </F>
                  </div>

                  <F label="Alamat Domisili Lengkap">
                    <Textarea
                      value={formData.alamat || ""}
                      onChange={e => handleChange("alamat", e.target.value)}
                      placeholder="Alamat lengkap tempat tinggal saat ini (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten)"
                      className="text-xs min-h-[80px]"
                    />
                  </F>
                </div>
              )}

              {/* Tab 4: Pendidikan & Finansial */}
              {formTab === "finansial" && (
                <div className="space-y-4 pt-1">
                  <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 space-y-3 bg-slate-50/40 dark:bg-zinc-900/30">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      Pendidikan Terakhir
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <F label="Jenjang">
                        <Select
                          value={formData.pendidikanTerakhir || "NONE"}
                          onValueChange={v => handleChange("pendidikanTerakhir", v === "NONE" ? "" : v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Jenjang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE" className="text-xs">— Pilih —</SelectItem>
                            {["SD", "SMP", "SMA", "D1", "D2", "D3", "D4", "S1", "S2", "S3"].map(p => (
                              <SelectItem key={p} value={p} className="text-xs">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </F>
                      <F label="Jurusan">
                        <Input
                          value={formData.jurusan || ""}
                          onChange={e => handleChange("jurusan", e.target.value)}
                          placeholder="Teknik Lingkungan, Manajemen"
                          className="h-9 text-xs"
                        />
                      </F>
                      <F label="Institusi / Universitas">
                        <Input
                          value={formData.institusi || ""}
                          onChange={e => handleChange("institusi", e.target.value)}
                          placeholder="Universitas Mataram"
                          className="h-9 text-xs"
                        />
                      </F>
                      <F label="Tahun Kelulusan">
                        <Input
                          value={formData.tahunLulus || ""}
                          onChange={e => handleChange("tahunLulus", e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="Contoh: 2018"
                          maxLength={4}
                          className="h-9 text-xs font-mono"
                        />
                      </F>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 space-y-3 bg-slate-50/40 dark:bg-zinc-900/30">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                      Rekening Bank & Jaminan Sosial
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <F label="Bank Penyalur Gaji">
                        <Select
                          value={formData.bank || "NONE"}
                          onValueChange={v => handleChange("bank", v === "NONE" ? "" : v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE" className="text-xs">— Pilih Bank —</SelectItem>
                            {["Bank NTB Syariah", "Bank BNI", "Bank BRI", "Bank Mandiri", "Bank BCA", "Bank Lainnya"].map(b => (
                              <SelectItem key={b} value={b} className="text-xs">
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </F>
                      <F label="Nomor Rekening">
                        <Input
                          value={formData.noRekening || ""}
                          onChange={e => handleChange("noRekening", e.target.value)}
                          placeholder="Contoh: 1234567890"
                          className="h-9 text-xs font-mono"
                        />
                      </F>
                      <F label="No. BPJS Kesehatan">
                        <Input
                          value={formData.bpjsKesehatan || ""}
                          onChange={e => handleChange("bpjsKesehatan", e.target.value)}
                          placeholder="13 digit angka"
                          className="h-9 text-xs font-mono"
                        />
                      </F>
                      <F label="No. BPJS Ketenagakerjaan">
                        <Input
                          value={formData.bpjsKetenagakerjaan || ""}
                          onChange={e => handleChange("bpjsKetenagakerjaan", e.target.value)}
                          placeholder="11 digit angka"
                          className="h-9 text-xs font-mono"
                        />
                      </F>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-3.5 border-t bg-slate-50/50 dark:bg-zinc-900/50 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving} className="h-9 text-xs">
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="h-9 text-xs">
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
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

      {/* Dialog: Tambah Riwayat Jabatan */}
      <Dialog open={showAddJabatan} onOpenChange={setShowAddJabatan}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Tambah Riwayat Jabatan
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddJabatan}>
            <div className="p-6 space-y-4">
              <F label="Nama Jabatan / Posisi">
                <Input
                  required
                  placeholder="e.g. Kepala Sub Bidang Distribusi"
                  value={jabatanForm.jabatan}
                  onChange={e => setJabatanForm(f => ({ ...f, jabatan: e.target.value }))}
                />
              </F>
              <F label="Unit Kerja / Bidang / Cabang">
                <Input
                  required
                  placeholder="e.g. Bidang Distribusi & Transmisi"
                  value={jabatanForm.unitDefinitif}
                  onChange={e => setJabatanForm(f => ({ ...f, unitDefinitif: e.target.value }))}
                />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="TMT Mulai (Tanggal Mulai)">
                  <Input
                    required
                    type="date"
                    value={jabatanForm.tanggalMulai}
                    onChange={e => setJabatanForm(f => ({ ...f, tanggalMulai: e.target.value }))}
                  />
                </F>
                <F label="TMT Selesai (Opsional)">
                  <Input
                    type="date"
                    value={jabatanForm.tanggalSelesai}
                    onChange={e => setJabatanForm(f => ({ ...f, tanggalSelesai: e.target.value }))}
                  />
                </F>
              </div>
              <p className="text-[11px] text-muted-foreground">
                * Catatan: Kosongkan TMT Selesai jika jabatan ini merupakan posisi yang saat itu masih berjalan / aktif.
              </p>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setShowAddJabatan(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmittingJabatan}>
                {isSubmittingJabatan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Riwayat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah Riwayat Pangkat */}
      <Dialog open={showAddPangkat} onOpenChange={setShowAddPangkat}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Tambah Riwayat Pangkat & Golongan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih golongan atau pangkat resmi. Nilai pasangannya akan otomatis terisi tanpa perlu mengetik manual.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPangkat}>
            <div className="p-6 space-y-4">
              {/* Golongan / Ruang */}
              <F label="Golongan / Ruang">
                <Select
                  value={pangkatForm.golongan}
                  onValueChange={handleGolonganChange}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    {daftarPangkat.map(p => (
                      <SelectItem key={p.golongan} value={p.golongan} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{p.golongan}</span>
                          <span className="text-muted-foreground">• {p.nama}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>

              {/* Nama Pangkat (Otomatis / Sinkron) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Nama Pangkat</Label>
                  <button
                    type="button"
                    onClick={() => setIsCustomPangkat(!isCustomPangkat)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {isCustomPangkat ? "Pilih dari Daftar Baku" : "Tulis Manual / Kustom"}
                  </button>
                </div>
                {isCustomPangkat ? (
                  <Input
                    required
                    placeholder="Contoh: Penata Muda Tk. I"
                    value={pangkatForm.pangkat}
                    onChange={e => setPangkatForm(f => ({ ...f, pangkat: e.target.value }))}
                    className="h-9 text-xs"
                  />
                ) : (
                  <Select
                    value={pangkatForm.pangkat}
                    onValueChange={handlePangkatChange}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Pangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      {daftarPangkat.map(p => (
                        <SelectItem key={p.nama} value={p.nama} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{p.nama}</span>
                            <span className="font-mono text-muted-foreground text-[11px]">({p.golongan})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {isCustomPangkat 
                    ? "Mode manual aktif untuk jabatan/pangkat khusus." 
                    : "Otomatis tersinkronisasi saat Anda memilih Golongan."}
                </p>
              </div>

              {/* TMT Berlaku */}
              <F label="TMT Berlaku">
                <Input
                  required
                  type="date"
                  value={pangkatForm.tanggalBerlaku}
                  onChange={e => setPangkatForm(f => ({ ...f, tanggalBerlaku: e.target.value }))}
                  className="h-9 text-xs"
                />
              </F>

              {/* Nomor SK */}
              <F label="Nomor SK (Pengesahan)">
                <Input
                  placeholder="Contoh: SK/DIR/KP/2023/045"
                  value={pangkatForm.nomorSK}
                  onChange={e => setPangkatForm(f => ({ ...f, nomorSK: e.target.value }))}
                  className="h-9 text-xs"
                />
              </F>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPangkat(false)}>Batal</Button>
              <Button type="submit" size="sm" disabled={isSubmittingPangkat}>
                {isSubmittingPangkat ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Pangkat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah Anggota Keluarga */}
      <Dialog open={showAddKeluarga} onOpenChange={setShowAddKeluarga}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Tambah Data Anggota Keluarga
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddKeluarga}>
            <div className="p-6 space-y-4">
              <F label="Nama Lengkap Anggota">
                <Input
                  required
                  placeholder="e.g. Siti Nurhaliza"
                  value={keluargaForm.nama}
                  onChange={e => setKeluargaForm(f => ({ ...f, nama: e.target.value }))}
                />
              </F>
              <F label="Hubungan Keluarga">
                <Select
                  value={keluargaForm.hubungan}
                  onValueChange={v => setKeluargaForm(f => ({ ...f, hubungan: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih Hubungan" /></SelectTrigger>
                  <SelectContent>
                    {["Suami", "Istri", "Anak", "Orang Tua", "Mertua", "Saudara Kandung", "Lainnya"].map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Pekerjaan">
                <Input
                  placeholder="e.g. Karyawan Swasta / Pelajar"
                  value={keluargaForm.pekerjaan}
                  onChange={e => setKeluargaForm(f => ({ ...f, pekerjaan: e.target.value }))}
                />
              </F>
              <F label="Nomor Telepon / Kontak">
                <Input
                  placeholder="e.g. 081234567890"
                  value={keluargaForm.telepon}
                  onChange={e => setKeluargaForm(f => ({ ...f, telepon: e.target.value }))}
                />
              </F>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setShowAddKeluarga(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmittingKeluarga}>
                {isSubmittingKeluarga ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah Pendidikan */}
      <Dialog open={showAddPendidikan} onOpenChange={setShowAddPendidikan}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Tambah Riwayat Pendidikan Formal
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPendidikan}>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <F label="Jenjang">
                  <Select
                    value={pendidikanForm.tingkat}
                    onValueChange={v => setPendidikanForm(f => ({ ...f, tingkat: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Jenjang" /></SelectTrigger>
                    <SelectContent>
                      {["SD","SMP","SMA","D1","D2","D3","D4","S1","S2","S3"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Tahun Kelulusan">
                  <Input
                    required
                    placeholder="e.g. 2018"
                    value={pendidikanForm.tahunLulus}
                    onChange={e => setPendidikanForm(f => ({ ...f, tahunLulus: e.target.value }))}
                  />
                </F>
              </div>
              <F label="Nama Institusi / Universitas / Sekolah">
                <Input
                  required
                  placeholder="e.g. Universitas Mataram"
                  value={pendidikanForm.institusi}
                  onChange={e => setPendidikanForm(f => ({ ...f, institusi: e.target.value }))}
                />
              </F>
              <F label="Jurusan / Program Studi">
                <Input
                  placeholder="e.g. Teknik Sipil / Akuntansi"
                  value={pendidikanForm.jurusan}
                  onChange={e => setPendidikanForm(f => ({ ...f, jurusan: e.target.value }))}
                />
              </F>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setShowAddPendidikan(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmittingPendidikan}>
                {isSubmittingPendidikan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Pendidikan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah Pelatihan */}
      <Dialog open={showAddPelatihan} onOpenChange={setShowAddPelatihan}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Tambah Riwayat Pelatihan & Sertifikasi
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPelatihan}>
            <div className="p-6 space-y-4">
              <F label="Nama Pelatihan / Diklat / Workshop">
                <Input
                  required
                  placeholder="e.g. Pelatihan Manajemen Sistem Distribusi Air"
                  value={pelatihanForm.namaPelatihan}
                  onChange={e => setPelatihanForm(f => ({ ...f, namaPelatihan: e.target.value }))}
                />
              </F>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <F label="Lembaga Penyelenggara">
                    <Input
                      required
                      placeholder="e.g. Perpamsi / Kementerian PUPR"
                      value={pelatihanForm.penyelenggara}
                      onChange={e => setPelatihanForm(f => ({ ...f, penyelenggara: e.target.value }))}
                    />
                  </F>
                </div>
                <div>
                  <F label="Tahun">
                    <Input
                      placeholder="e.g. 2024"
                      value={pelatihanForm.tahun}
                      onChange={e => setPelatihanForm(f => ({ ...f, tahun: e.target.value }))}
                    />
                  </F>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={() => setShowAddPelatihan(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmittingPelatihan}>
                {isSubmittingPelatihan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Pelatihan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
