"use client"
import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Loader2, Sparkles, History, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  templateUndangan, templateSKMutasi, templateSuratPeringatan,
  formatTanggalIndonesia, formatHariTanggal,
  type DataSurat
} from "@/lib/utils/surat-templates"
import {
  generateNomorSurat, saveArsipSurat, getArsipSurat, deleteArsipSurat
} from "@/lib/actions/surat"

// ============ CLIENT: Download docx ============
async function downloadSurat(data: DataSurat, namaFile: string) {
  const PizZipModule = await import("pizzip")
  const PizZip = PizZipModule.default || PizZipModule
  const DocxModule = await import("docxtemplater")
  const Docxtemplater = DocxModule.default || DocxModule
  const FileSaverModule = await import("file-saver")
  const saveAs = FileSaverModule.saveAs || FileSaverModule.default?.saveAs || FileSaverModule.default

  const response = await fetch("/templates/template_surat_lengkap.docx")
  if (!response.ok) throw new Error("Template tidak ditemukan di /templates/template_surat_lengkap.docx")
  const arrayBuffer = await response.arrayBuffer()
  const zip = new PizZip(arrayBuffer)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
  doc.render(data)

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  saveAs(blob, `${namaFile}.docx`)
}

// ============ HELPERS ============
// Kepada multi-baris → satu baris untuk docx agar tidak merusak layout tabel
function formatKepadaDocx(kepada: string): string {
  return kepada
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .join(", ")
}

// Jabatan-jabatan yang tidak butuh NIK
const JABATAN_TANPA_NIK = [
  "Direktur Utama", "Direktur Teknik", "Direktur Umum"
]

// ============ STATE DEFAULTS ============
const emptyUndangan = {
  nomor_surat: "",
  lampiran: "-",
  perihal: "",
  tanggal_surat: new Date().toISOString().split("T")[0],
  kepada: "",
  tempat_tujuan: "Praya",
  isi_pembuka: "",
  // Detail acara — HANYA untuk metadata arsip, tidak otomatis masuk badan surat
  hari_tanggal_acara: "",
  jam_acara: "09.00 WITA s/d selesai",
  lokasi_acara: "Aula Kantor Pusat Perumdam Tirta Ardhia Rinjani",
  nama_acara: "",
  jabatan_penandatangan: "Direktur Utama",
  nama_penandatangan: "",
  nik_penandatangan: "",
}

const emptySkMutasi = {
  nomor_surat: "",
  nama_pegawai: "",
  jabatan_asal: "",
  jabatan_tujuan: "",
  unit_asal: "",
  unit_tujuan: "",
  tanggal_efektif: "",
  tanggal_surat: new Date().toISOString().split("T")[0],
  jabatan_penandatangan: "Direktur Utama",
  nama_penandatangan: "",
  nik_penandatangan: "",
}

const emptySp = {
  nomor_surat: "",
  jenis_sp: "Surat Peringatan Pertama (SP-1)",
  nama_pegawai: "",
  jabatan: "",
  unit_kerja: "",
  alasan: "",
  tanggal_surat: new Date().toISOString().split("T")[0],
  jabatan_penandatangan: "Direktur Utama",
  nama_penandatangan: "",
  nik_penandatangan: "",
}

// ============ HALAMAN ============
export default function SKPage() {
  const [activeTab, setActiveTab] = useState("undangan")
  const [isLoading, setIsLoading] = useState(false)
  const [arsipList, setArsipList] = useState<any[]>([])
  const [arsipLoading, setArsipLoading] = useState(false)

  const [undangan, setUndangan] = useState({ ...emptyUndangan })
  const [skMutasi, setSkMutasi] = useState({ ...emptySkMutasi })
  const [sp, setSp] = useState({ ...emptySp })

  const loadArsip = useCallback(async () => {
    setArsipLoading(true)
    const data = await getArsipSurat()
    setArsipList(data)
    setArsipLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === "arsip") loadArsip()
  }, [activeTab, loadArsip])

  // ---- Generate Nomor ----
  const handleGenerateNomor = async (setter: any, field: string, kode?: string) => {
    const nomor = await generateNomorSurat(kode)
    setter((prev: any) => ({ ...prev, [field]: nomor }))
    toast.success("Nomor surat digenerate otomatis")
  }

  // ---- Auto-simpan arsip ----
  const autoSaveArsip = async (data: DataSurat, jenis: string, extraMeta?: Record<string, any>) => {
    await saveArsipSurat({
      nomorSurat: data.nomor_surat,
      jenisSurat: jenis,
      perihal: data.perihal,
      tanggalSurat: data.tanggal_surat,
      kepada: data.kepada,
      namaPenandatangan: data.nama_penandatangan,
      nikPenandatangan: data.nik_penandatangan,
      jabatanPenandatangan: data.jabatan_penandatangan,
      dataLengkap: { ...data, ...extraMeta } as any,
    })
  }

  // ---- Hapus arsip ----
  const handleDeleteArsip = async (id: string) => {
    const res = await deleteArsipSurat(id)
    if (res.success) {
      setArsipList(prev => prev.filter(a => a.id !== id))
      toast.success("Arsip dihapus")
    } else {
      toast.error("Gagal menghapus arsip")
    }
  }

  // ---- Re-download dari arsip ----
  const handleRedownload = async (arsip: any) => {
    setIsLoading(true)
    try {
      const data = arsip.dataLengkap as DataSurat
      await downloadSurat(data, `${arsip.jenisSurat}_${arsip.nomorSurat.replace(/\//g, "-")}`)
      toast.success("Berhasil didownload ulang")
    } catch (err: any) {
      toast.error(err.message || "Gagal download ulang")
    }
    setIsLoading(false)
  }

  // ---- Download Undangan ----
  const handleDownloadUndangan = async () => {
    if (!undangan.perihal || !undangan.kepada || !undangan.nama_penandatangan) {
      toast.error("Perihal, Kepada, dan Nama Penandatangan wajib diisi")
      return
    }
    setIsLoading(true)
    try {
      const kepadaDocx = formatKepadaDocx(undangan.kepada)
      const isTanpaNik = JABATAN_TANPA_NIK.includes(undangan.jabatan_penandatangan)
      const nikFormatted = isTanpaNik ? "" : (undangan.nik_penandatangan ? `NIK. ${undangan.nik_penandatangan}` : "")

      const data = templateUndangan({
        ...undangan,
        kepada: kepadaDocx,
        tanggal_surat: formatTanggalIndonesia(new Date(undangan.tanggal_surat)),
        hari_tanggal_acara: undefined,
        jam_acara: undefined,
        lokasi_acara: undefined,
        nama_acara: undefined,
      })
      // Override nik AFTER template (template would set default "____")
      const finalData = { ...data, nik_penandatangan: nikFormatted } as any
      
      await downloadSurat(finalData, `Undangan_${undangan.perihal.replace(/\s+/g, "_")}`)
      await autoSaveArsip(
        { ...finalData, kepada: undangan.kepada },
        "UNDANGAN",
        {
          detail_acara: {
            hari_tanggal: undangan.hari_tanggal_acara ? formatHariTanggal(new Date(undangan.hari_tanggal_acara)) : "-",
            jam: undangan.jam_acara,
            lokasi: undangan.lokasi_acara,
            nama_acara: undangan.nama_acara,
          }
        }
      )
      toast.success("Undangan berhasil didownload & disimpan ke arsip!")
    } catch (err: any) {
      toast.error(err.message || "Gagal generate surat")
    }
    setIsLoading(false)
  }

  // ---- Download SK Mutasi ----
  const handleDownloadSKMutasi = async () => {
    if (!skMutasi.nama_pegawai || !skMutasi.nama_penandatangan) {
      toast.error("Nama pegawai dan penandatangan wajib diisi")
      return
    }
    setIsLoading(true)
    try {
      const isTanpaNik = JABATAN_TANPA_NIK.includes(skMutasi.jabatan_penandatangan)
      const nikFormatted = isTanpaNik ? "" : (skMutasi.nik_penandatangan ? `NIK. ${skMutasi.nik_penandatangan}` : "")

      const data = templateSKMutasi({
        nama: skMutasi.nama_pegawai,
        jabatanAsal: skMutasi.jabatan_asal,
        jabatanTujuan: skMutasi.jabatan_tujuan,
        tanggalEfektif: skMutasi.tanggal_efektif ? formatTanggalIndonesia(new Date(skMutasi.tanggal_efektif)) : "___",
      })
      
      const finalData = {
        ...data,
        nomor_surat: skMutasi.nomor_surat || data.nomor_surat,
        tanggal_surat: formatTanggalIndonesia(new Date(skMutasi.tanggal_surat)),
        nama_penandatangan: skMutasi.nama_penandatangan,
        nik_penandatangan: nikFormatted,
        jabatan_penandatangan: skMutasi.jabatan_penandatangan,
      }
      
      await downloadSurat(finalData, `SK_Mutasi_${skMutasi.nama_pegawai.replace(/\s+/g, "_")}`)
      await autoSaveArsip(finalData, "SK_MUTASI")
      toast.success("SK Mutasi berhasil didownload & disimpan ke arsip!")
    } catch (err: any) {
      toast.error(err.message || "Gagal generate SK")
    }
    setIsLoading(false)
  }

  // ---- Download Surat Peringatan ----
  const handleDownloadSP = async () => {
    if (!sp.nama_pegawai || !sp.alasan || !sp.nama_penandatangan) {
      toast.error("Nama pegawai, alasan, dan penandatangan wajib diisi")
      return
    }
    setIsLoading(true)
    try {
      const isTanpaNik = JABATAN_TANPA_NIK.includes(sp.jabatan_penandatangan)
      const nikFormatted = isTanpaNik ? "" : (sp.nik_penandatangan ? `NIK. ${sp.nik_penandatangan}` : "")

      const data = templateSuratPeringatan({
        nama: sp.nama_pegawai,
        jabatan: sp.jabatan,
        alasan: sp.alasan,
      }, sp.jenis_sp)
      
      const finalData = {
        ...data,
        nomor_surat: sp.nomor_surat || data.nomor_surat,
        tanggal_surat: formatTanggalIndonesia(new Date(sp.tanggal_surat)),
        nama_penandatangan: sp.nama_penandatangan,
        nik_penandatangan: nikFormatted,
        jabatan_penandatangan: sp.jabatan_penandatangan,
      }

      await downloadSurat(finalData, `${sp.jenis_sp.replace(/\s+/g, "_")}_${sp.nama_pegawai.replace(/\s+/g, "_")}`)
      await autoSaveArsip(finalData, "SURAT_PERINGATAN")
      toast.success("Surat Peringatan berhasil didownload & disimpan ke arsip!")
    } catch (err: any) {
      toast.error(err.message || "Gagal generate surat")
    }
    setIsLoading(false)
  }

  const labelJenis: Record<string, string> = {
    UNDANGAN: "Undangan",
    SK_MUTASI: "SK Mutasi",
    SURAT_PERINGATAN: "Surat Peringatan",
  }

  // ---- Komponen penandatangan inline (bukan lambda komponen) ----
  const renderPenandatangan = (state: any, setter: any) => (
    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">✍️ Penandatangan</p>
      <Select value={state.jabatan_penandatangan} onValueChange={v => setter((p: any) => ({ ...p, jabatan_penandatangan: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Direktur Utama">Direktur Utama</SelectItem>
          <SelectItem value="Direktur Teknik">Direktur Teknik</SelectItem>
          <SelectItem value="Direktur Umum">Direktur Umum</SelectItem>
          <SelectItem value="Kepala Bagian SDM">Kepala Bagian SDM</SelectItem>
        </SelectContent>
      </Select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Nama Penandatangan *</Label>
          <Input
            className="mt-1"
            value={state.nama_penandatangan}
            onChange={e => setter((p: any) => ({ ...p, nama_penandatangan: e.target.value }))}
            placeholder="Bambang Suryanto, S.E."
          />
        </div>
        {/* FIX: NIK disembunyikan untuk jabatan Direktur */}
        {!JABATAN_TANPA_NIK.includes(state.jabatan_penandatangan) && (
          <div>
            <Label>NIK</Label>
            <Input
              className="mt-1 font-mono"
              value={state.nik_penandatangan}
              onChange={e => setter((p: any) => ({ ...p, nik_penandatangan: e.target.value }))}
              placeholder="NIK penandatangan"
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Administrasi", "Generator Surat"]} />
        <main className="flex-1 overflow-auto p-4 md:p-6">

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Generator Surat Resmi</h1>
                <p className="text-sm text-muted-foreground">Generate surat dengan kop surat Perumdam Tirta Ardhia Rinjani</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="undangan">📨 Undangan</TabsTrigger>
              <TabsTrigger value="sk-mutasi">📋 SK Mutasi</TabsTrigger>
              <TabsTrigger value="sp">⚠️ Surat Peringatan</TabsTrigger>
              <TabsTrigger value="arsip"><History className="w-3.5 h-3.5 mr-1.5" />Arsip</TabsTrigger>
            </TabsList>

            {/* ===== TAB UNDANGAN ===== */}
            <TabsContent value="undangan">
              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" /> Form Surat Undangan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nomor Surat</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={undangan.nomor_surat} onChange={e => setUndangan(p => ({ ...p, nomor_surat: e.target.value }))} placeholder="001/PERUMDAM-TIARA/III/2026" className="flex-1" />
                        <Button variant="outline" size="sm" onClick={() => handleGenerateNomor(setUndangan, "nomor_surat")} className="gap-1 shrink-0">
                          <Sparkles className="h-3.5 w-3.5" /> Auto
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Lampiran</Label>
                        <Input className="mt-1" value={undangan.lampiran} onChange={e => setUndangan(p => ({ ...p, lampiran: e.target.value }))} placeholder="-" />
                      </div>
                      <div>
                        <Label>Tanggal Surat</Label>
                        <Input className="mt-1" type="date" value={undangan.tanggal_surat} onChange={e => setUndangan(p => ({ ...p, tanggal_surat: e.target.value }))} />
                      </div>
                    </div>

                    <div>
                      <Label>Perihal *</Label>
                      <Input className="mt-1" value={undangan.perihal} onChange={e => setUndangan(p => ({ ...p, perihal: e.target.value }))} placeholder="Undangan Sosialisasi TRIS" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>
                          Kepada *
                          <span className="text-xs text-muted-foreground ml-1">(Enter = baris baru)</span>
                        </Label>
                        <Textarea
                          className="mt-1 min-h-[90px]"
                          value={undangan.kepada}
                          onChange={e => setUndangan(p => ({ ...p, kepada: e.target.value }))}
                          placeholder={"1. Dewan Pengawas\n2. Direktur Umum dan Keuangan\n3. Kepala Bidang"}
                        />
                      </div>
                      <div>
                        <Label>Tempat Tujuan</Label>
                        <Input className="mt-1" value={undangan.tempat_tujuan} onChange={e => setUndangan(p => ({ ...p, tempat_tujuan: e.target.value }))} />
                      </div>
                    </div>

                    {/* Isi Pembuka: user menulis SELURUH badan surat termasuk detail acara */}
                    <div>
                      <Label>Isi Surat (Pembuka + Detail Acara + Penutup)</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                        Tulis seluruh isi surat di sini. Gunakan Enter untuk paragraf baru. Detail acara (hari/tanggal, jam, tempat) ditulis langsung di sini.
                      </p>
                      <Textarea
                        className="mt-1 min-h-[220px] font-serif text-sm"
                        value={undangan.isi_pembuka}
                        onChange={e => setUndangan(p => ({ ...p, isi_pembuka: e.target.value }))}
                        placeholder={"Bismillahhirrahmanirahim\nAssalamu'alaikum Wr. Wb.\n\nSehubungan dengan...\n\nAdapun kegiatan akan dilaksanakan pada:\nHari/Tanggal : Sabtu, 29 Maret 2026\nWaktu         : 08.00 WITA s/d Selesai\nTempat        : ...\n\nDemikian disampaikan, atas perhatian kami ucapkan terima kasih.\n\nWassalamu'alaikum Wr. Wb."}
                      />
                    </div>

                    {/* Detail Acara — hanya untuk catatan metadata arsip */}
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 space-y-3 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        📅 Detail Acara <span className="normal-case font-normal">(opsional, hanya untuk catatan di arsip)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Tanggal Acara</Label>
                          <Input className="mt-1" type="date" value={undangan.hari_tanggal_acara} onChange={e => setUndangan(p => ({ ...p, hari_tanggal_acara: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs">Nama Acara</Label>
                          <Input className="mt-1" value={undangan.nama_acara} onChange={e => setUndangan(p => ({ ...p, nama_acara: e.target.value }))} placeholder="Sosialisasi TRIS" />
                        </div>
                      </div>
                    </div>

                    {renderPenandatangan(undangan, setUndangan)}

                    <Button className="w-full gap-2" onClick={handleDownloadUndangan} disabled={isLoading}>
                      {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Download className="h-4 w-4" />Download Undangan (.docx)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4" /> Preview Surat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-white p-6 text-sm font-serif space-y-3 min-h-[400px] shadow-inner">
                      <div className="border-b-2 border-gray-800 pb-3 mb-4 text-center">
                        <p className="font-bold text-sm">PERUMDAM TIRTA ARDHIA RINJANI</p>
                        <p className="text-xs text-gray-600">Jl. Ahmad Yani No. 1, Praya — Lombok Tengah</p>
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>Nomor&nbsp;&nbsp;&nbsp;: {undangan.nomor_surat || "___"}</p>
                        <p>Lampiran : {undangan.lampiran}</p>
                        <p>Perihal&nbsp;&nbsp;&nbsp;: <strong>{undangan.perihal || "___"}</strong></p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        Praya, {undangan.tanggal_surat ? formatTanggalIndonesia(new Date(undangan.tanggal_surat)) : "___"}
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Kepada</p>
                        {undangan.kepada
                          ? undangan.kepada.split("\n").map((line, i) => (
                              <p key={i}>{i === 0 ? `Yth. ${line}` : `     ${line}`}</p>
                            ))
                          : <p>Yth. ___</p>
                        }
                        <p>di - {undangan.tempat_tujuan}</p>
                      </div>
                      {undangan.isi_pembuka && (
                        <div className="text-xs text-gray-700 space-y-2 mt-2">
                          {undangan.isi_pembuka.split("\n").map((line, i) => (
                            <p key={i}>{line || <>&nbsp;</>}</p>
                          ))}
                        </div>
                      )}
                      {undangan.nama_penandatangan && (
                        <div className="text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-200">
                          <p className="text-gray-600">{undangan.jabatan_penandatangan}</p>
                          <p className="mt-8 font-bold text-gray-900">{undangan.nama_penandatangan}</p>
                          {!JABATAN_TANPA_NIK.includes(undangan.jabatan_penandatangan) && undangan.nik_penandatangan && (
                            <p className="text-gray-500">NIK. {undangan.nik_penandatangan}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      Preview sederhana — file .docx akan menyertakan kop surat resmi
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== TAB SK MUTASI ===== */}
            <TabsContent value="sk-mutasi">
              <Card className="card-premium max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" /> Form SK Mutasi Pegawai
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nomor SK</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={skMutasi.nomor_surat} onChange={e => setSkMutasi(p => ({ ...p, nomor_surat: e.target.value }))} placeholder="001/SK-MUT/PERUMDAM-TIARA/III/2026" className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => handleGenerateNomor(setSkMutasi, "nomor_surat", "SK-MUT/PERUMDAM-TIARA")} className="gap-1 shrink-0">
                        <Sparkles className="h-3.5 w-3.5" /> Auto
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Pegawai *</Label>
                      <Input className="mt-1" value={skMutasi.nama_pegawai} onChange={e => setSkMutasi(p => ({ ...p, nama_pegawai: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Tanggal Efektif</Label>
                      <Input className="mt-1" type="date" value={skMutasi.tanggal_efektif} onChange={e => setSkMutasi(p => ({ ...p, tanggal_efektif: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Jabatan Asal</Label>
                      <Input className="mt-1" value={skMutasi.jabatan_asal} onChange={e => setSkMutasi(p => ({ ...p, jabatan_asal: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Jabatan Tujuan</Label>
                      <Input className="mt-1" value={skMutasi.jabatan_tujuan} onChange={e => setSkMutasi(p => ({ ...p, jabatan_tujuan: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Unit/Bidang Asal</Label>
                      <Input className="mt-1" value={skMutasi.unit_asal} onChange={e => setSkMutasi(p => ({ ...p, unit_asal: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Unit/Bidang Tujuan</Label>
                      <Input className="mt-1" value={skMutasi.unit_tujuan} onChange={e => setSkMutasi(p => ({ ...p, unit_tujuan: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Tanggal Surat</Label>
                    <Input className="mt-1 max-w-xs" type="date" value={skMutasi.tanggal_surat} onChange={e => setSkMutasi(p => ({ ...p, tanggal_surat: e.target.value }))} />
                  </div>
                  {renderPenandatangan(skMutasi, setSkMutasi)}
                  <Button className="w-full gap-2" onClick={handleDownloadSKMutasi} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Download className="h-4 w-4" />Download SK Mutasi (.docx)</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== TAB SURAT PERINGATAN ===== */}
            <TabsContent value="sp">
              <Card className="card-premium max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" /> Form Surat Peringatan (SP)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Jenis SP</Label>
                    <Select value={sp.jenis_sp} onValueChange={v => setSp(p => ({ ...p, jenis_sp: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Surat Peringatan Pertama (SP-1)">SP-1 — Peringatan Pertama</SelectItem>
                        <SelectItem value="Surat Peringatan Kedua (SP-2)">SP-2 — Peringatan Kedua</SelectItem>
                        <SelectItem value="Surat Peringatan Ketiga (SP-3)">SP-3 — Peringatan Ketiga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nomor Surat</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={sp.nomor_surat} onChange={e => setSp(p => ({ ...p, nomor_surat: e.target.value }))} className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => handleGenerateNomor(setSp, "nomor_surat", "SP/PERUMDAM-TIARA")} className="gap-1 shrink-0">
                        <Sparkles className="h-3.5 w-3.5" /> Auto
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Pegawai *</Label>
                      <Input className="mt-1" value={sp.nama_pegawai} onChange={e => setSp(p => ({ ...p, nama_pegawai: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Jabatan</Label>
                      <Input className="mt-1" value={sp.jabatan} onChange={e => setSp(p => ({ ...p, jabatan: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Alasan / Pelanggaran *</Label>
                    <Textarea className="mt-1" rows={3} value={sp.alasan} onChange={e => setSp(p => ({ ...p, alasan: e.target.value }))} placeholder="Jelaskan pelanggaran yang dilakukan..." />
                  </div>
                  <div>
                    <Label>Tanggal Surat</Label>
                    <Input className="mt-1 max-w-xs" type="date" value={sp.tanggal_surat} onChange={e => setSp(p => ({ ...p, tanggal_surat: e.target.value }))} />
                  </div>
                  {renderPenandatangan(sp, setSp)}
                  <Button className="w-full gap-2" onClick={handleDownloadSP} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Download className="h-4 w-4" />Download Surat Peringatan (.docx)</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== TAB ARSIP ===== */}
            <TabsContent value="arsip">
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-4 w-4" /> Arsip Surat
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={loadArsip} disabled={arsipLoading} className="gap-1">
                      <RefreshCw className={`h-3.5 w-3.5 ${arsipLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {arsipLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : arsipList.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-10 italic">
                      Belum ada arsip surat. Download surat pertama untuk membuat arsip otomatis.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nomor Surat</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Perihal</TableHead>
                            <TableHead>Kepada</TableHead>
                            <TableHead>Penandatangan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {arsipList.map(arsip => (
                            <TableRow key={arsip.id}>
                              <TableCell className="font-mono text-xs">{arsip.nomorSurat}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {labelJenis[arsip.jenisSurat] || arsip.jenisSurat}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm max-w-[180px] truncate" title={arsip.perihal}>{arsip.perihal}</TableCell>
                              <TableCell className="text-xs max-w-[120px] truncate" title={arsip.kepada}>{arsip.kepada || "-"}</TableCell>
                              <TableCell className="text-sm">{arsip.namaPenandatangan}</TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{arsip.tanggalSurat}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Download ulang */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 gap-1 text-xs"
                                    onClick={() => handleRedownload(arsip)}
                                    disabled={isLoading || !arsip.dataLengkap}
                                    title="Download ulang"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  {/* Hapus */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs text-red-600 hover:bg-red-50 border-red-200" title="Hapus arsip">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Arsip?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Arsip <strong>{arsip.nomorSurat}</strong> akan dihapus permanen. Nomor urut berikutnya akan tetap melanjutkan dari angka tertinggi yang sudah ada.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteArsip(arsip.id)}>
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
