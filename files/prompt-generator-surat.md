# PROMPT: MODUL GENERATOR SURAT RESMI TRIS
## Download .docx dengan kop surat asli Perumdam Tirta Ardhia Rinjani

---

## SETUP

### Install library
```bash
npm install docxtemplater pizzip file-saver
npm install --save-dev @types/file-saver
```

### Upload template ke public
Simpan file `template_surat_lengkap.docx` ke folder `public/templates/`

---

## BUAT FILE `lib/actions/surat.ts`

(Gunakan kode dari file `surat-actions.ts` yang disediakan)

---

## BUAT HALAMAN `app/sk/page.tsx`

Halaman untuk generate berbagai jenis surat resmi:

```tsx
"use client"
import { useState } from "react"
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
import { FileText, Download, Eye, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  templateUndangan, templateSKMutasi, templateSuratPeringatan,
  generateNomorSurat, formatTanggalIndonesia, formatHariTanggal,
  type DataSurat
} from "@/lib/actions/surat"

// Fungsi download docx (client-side)
async function downloadSurat(data: DataSurat, namaFile: string) {
  // Load library
  const PizZip = (await import("pizzip")).default
  const Docxtemplater = (await import("docxtemplater")).default
  const { saveAs } = await import("file-saver")

  // Fetch template
  const response = await fetch("/templates/template_surat_lengkap.docx")
  const arrayBuffer = await response.arrayBuffer()
  const zip = new PizZip(arrayBuffer)

  // Replace placeholder
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render(data)

  // Download
  const blob = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  saveAs(blob, `${namaFile}.docx`)
}

export default function SKPage() {
  const [activeTab, setActiveTab] = useState("undangan")
  const [isLoading, setIsLoading] = useState(false)

  // ===== STATE UNDANGAN =====
  const [undangan, setUndangan] = useState({
    nomor_surat: "",
    lampiran: "-",
    perihal: "",
    tanggal_surat: new Date().toISOString().split("T")[0],
    kepada: "",
    tempat_tujuan: "Praya",
    isi_pembuka: "",
    hari_tanggal_acara: "",
    jam_acara: "09.00 WITA s/d selesai",
    lokasi_acara: "Aula Kantor Pusat Perumdam Tirta Ardhia Rinjani",
    nama_acara: "",
    isi_penutup: "Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu kami ucapkan terima kasih.",
    jabatan_penandatangan: "Direktur Utama",
    nama_penandatangan: "",
    nik_penandatangan: "",
  })

  // ===== STATE SK MUTASI =====
  const [skMutasi, setSkMutasi] = useState({
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
  })

  // ===== STATE SURAT PERINGATAN =====
  const [sp, setSp] = useState({
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
  })

  // ===== GENERATE NOMOR OTOMATIS =====
  const handleGenerateNomor = async (setter: any, field: string) => {
    const nomor = await generateNomorSurat()
    setter((prev: any) => ({ ...prev, [field]: nomor }))
    toast.success("Nomor surat digenerate otomatis")
  }

  // ===== DOWNLOAD UNDANGAN =====
  const handleDownloadUndangan = async () => {
    if (!undangan.perihal || !undangan.kepada || !undangan.nama_penandatangan) {
      toast.error("Perihal, Kepada, dan Nama Penandatangan wajib diisi")
      return
    }
    setIsLoading(true)
    try {
      const data = templateUndangan({
        ...undangan,
        tanggal_surat: formatTanggalIndonesia(new Date(undangan.tanggal_surat)),
        hari_tanggal_acara: undangan.hari_tanggal_acara
          ? formatHariTanggal(new Date(undangan.hari_tanggal_acara))
          : undefined,
      })
      await downloadSurat(data, `Undangan_${undangan.perihal.replace(/\s+/g, "_")}`)
      toast.success("Surat berhasil didownload!")
    } catch (err) {
      toast.error("Gagal generate surat")
      console.error(err)
    }
    setIsLoading(false)
  }

  // ===== DOWNLOAD SK MUTASI =====
  const handleDownloadSKMutasi = async () => {
    if (!skMutasi.nama_pegawai || !skMutasi.nama_penandatangan) {
      toast.error("Nama pegawai dan penandatangan wajib diisi")
      return
    }
    setIsLoading(true)
    try {
      const data = templateSKMutasi({
        nama: skMutasi.nama_pegawai,
        jabatanAsal: skMutasi.jabatan_asal,
        jabatanTujuan: skMutasi.jabatan_tujuan,
        tanggalEfektif: skMutasi.tanggal_efektif
          ? formatTanggalIndonesia(new Date(skMutasi.tanggal_efektif))
          : "___",
      })
      const finalData = {
        ...data,
        nomor_surat: skMutasi.nomor_surat || data.nomor_surat,
        tanggal_surat: formatTanggalIndonesia(new Date(skMutasi.tanggal_surat)),
        nama_penandatangan: skMutasi.nama_penandatangan,
        nik_penandatangan: skMutasi.nik_penandatangan,
        jabatan_penandatangan: skMutasi.jabatan_penandatangan,
      }
      await downloadSurat(finalData, `SK_Mutasi_${skMutasi.nama_pegawai.replace(/\s+/g, "_")}`)
      toast.success("SK Mutasi berhasil didownload!")
    } catch (err) {
      toast.error("Gagal generate SK")
    }
    setIsLoading(false)
  }

  // ===== DOWNLOAD SURAT PERINGATAN =====
  const handleDownloadSP = async () => {
    if (!sp.nama_pegawai || !sp.alasan || !sp.nama_penandatangan) {
      toast.error("Nama pegawai, alasan, dan penandatangan wajib diisi")
      return
    }
    setIsLoading(true)
    try {
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
        nik_penandatangan: sp.nik_penandatangan,
        jabatan_penandatangan: sp.jabatan_penandatangan,
      }
      await downloadSurat(finalData, `${sp.jenis_sp.replace(/\s+/g, "_")}_${sp.nama_pegawai.replace(/\s+/g, "_")}`)
      toast.success("Surat Peringatan berhasil didownload!")
    } catch (err) {
      toast.error("Gagal generate surat")
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Administrasi", "Generator Surat"]} />
        <main className="flex-1 overflow-auto p-4 md:p-6">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Generator Surat Resmi</h1>
            <p className="text-sm text-muted-foreground">
              Generate surat resmi dengan kop surat Perumdam Tirta Ardhia Rinjani otomatis
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="undangan">Undangan</TabsTrigger>
              <TabsTrigger value="sk-mutasi">SK Mutasi</TabsTrigger>
              <TabsTrigger value="sp">Surat Peringatan</TabsTrigger>
            </TabsList>

            {/* ===== TAB UNDANGAN ===== */}
            <TabsContent value="undangan">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Form Undangan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Nomor */}
                    <div>
                      <Label>Nomor Surat</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={undangan.nomor_surat}
                          onChange={e => setUndangan(p => ({...p, nomor_surat: e.target.value}))}
                          placeholder="001/PERUMDAM-TIARA/III/2026"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={() => handleGenerateNomor(setUndangan, "nomor_surat")}>
                          Auto
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lampiran</Label>
                        <Input className="mt-1" value={undangan.lampiran} onChange={e => setUndangan(p => ({...p, lampiran: e.target.value}))} placeholder="-" />
                      </div>
                      <div>
                        <Label>Tanggal Surat</Label>
                        <Input className="mt-1" type="date" value={undangan.tanggal_surat} onChange={e => setUndangan(p => ({...p, tanggal_surat: e.target.value}))} />
                      </div>
                    </div>

                    <div>
                      <Label>Perihal *</Label>
                      <Input className="mt-1" value={undangan.perihal} onChange={e => setUndangan(p => ({...p, perihal: e.target.value}))} placeholder="Undangan Sosialisasi TRIS" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Kepada *</Label>
                        <Input className="mt-1" value={undangan.kepada} onChange={e => setUndangan(p => ({...p, kepada: e.target.value}))} placeholder="Seluruh Kepala Bidang" />
                      </div>
                      <div>
                        <Label>Tempat Tujuan</Label>
                        <Input className="mt-1" value={undangan.tempat_tujuan} onChange={e => setUndangan(p => ({...p, tempat_tujuan: e.target.value}))} />
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Detail Acara</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Tanggal Acara</Label>
                          <Input className="mt-1" type="date" value={undangan.hari_tanggal_acara} onChange={e => setUndangan(p => ({...p, hari_tanggal_acara: e.target.value}))} />
                        </div>
                        <div>
                          <Label>Jam</Label>
                          <Input className="mt-1" value={undangan.jam_acara} onChange={e => setUndangan(p => ({...p, jam_acara: e.target.value}))} />
                        </div>
                      </div>
                      <div>
                        <Label>Nama Acara</Label>
                        <Input className="mt-1" value={undangan.nama_acara} onChange={e => setUndangan(p => ({...p, nama_acara: e.target.value}))} placeholder="Sosialisasi TRIS" />
                      </div>
                      <div>
                        <Label>Lokasi</Label>
                        <Input className="mt-1" value={undangan.lokasi_acara} onChange={e => setUndangan(p => ({...p, lokasi_acara: e.target.value}))} />
                      </div>
                    </div>

                    <div>
                      <Label>Isi Pembuka</Label>
                      <Textarea className="mt-1" rows={2} value={undangan.isi_pembuka} onChange={e => setUndangan(p => ({...p, isi_pembuka: e.target.value}))} placeholder="...kami mengundang Bapak/Ibu untuk hadir..." />
                    </div>

                    <div className="rounded-lg bg-primary/5 p-3 space-y-3">
                      <p className="text-xs font-semibold text-primary uppercase">Penandatangan</p>
                      <Select value={undangan.jabatan_penandatangan} onValueChange={v => setUndangan(p => ({...p, jabatan_penandatangan: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Direktur Utama">Direktur Utama</SelectItem>
                          <SelectItem value="Direktur Teknik">Direktur Teknik</SelectItem>
                          <SelectItem value="Direktur Umum">Direktur Umum</SelectItem>
                          <SelectItem value="Kepala Bagian SDM">Kepala Bagian SDM</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nama *</Label>
                          <Input className="mt-1" value={undangan.nama_penandatangan} onChange={e => setUndangan(p => ({...p, nama_penandatangan: e.target.value}))} placeholder="Ir. Joko Widagdo, M.M." />
                        </div>
                        <div>
                          <Label>NIK</Label>
                          <Input className="mt-1 font-mono" value={undangan.nik_penandatangan} onChange={e => setUndangan(p => ({...p, nik_penandatangan: e.target.value}))} placeholder="NIK penandatangan" />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full gap-2" onClick={handleDownloadUndangan} disabled={isLoading}>
                      {isLoading
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                        : <><Download className="h-4 w-4" />Download Undangan (.docx)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" /> Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-white p-6 text-sm font-serif space-y-3 min-h-[400px]">
                      <div className="text-xs text-muted-foreground">
                        <p>Nomor &nbsp;&nbsp;: {undangan.nomor_surat || "___"}</p>
                        <p>Lampiran : {undangan.lampiran}</p>
                        <p>Perihal &nbsp;&nbsp;: {undangan.perihal || "___"}</p>
                      </div>
                      <div className="text-right text-xs">
                        Praya, {undangan.tanggal_surat ? formatTanggalIndonesia(new Date(undangan.tanggal_surat)) : "___"}
                      </div>
                      <div className="text-xs">
                        <p>Kepada</p>
                        <p>Yth. {undangan.kepada || "___"}</p>
                        <p>di - {undangan.tempat_tujuan}</p>
                      </div>
                      {undangan.nama_acara && (
                        <div className="rounded bg-muted/50 p-2 text-xs">
                          <p>📅 {undangan.hari_tanggal_acara ? formatHariTanggal(new Date(undangan.hari_tanggal_acara)) : "___"}</p>
                          <p>⏰ {undangan.jam_acara}</p>
                          <p>📍 {undangan.lokasi_acara}</p>
                          <p>📋 {undangan.nama_acara}</p>
                        </div>
                      )}
                      {undangan.nama_penandatangan && (
                        <div className="text-center text-xs mt-4">
                          <p>{undangan.jabatan_penandatangan}</p>
                          <p className="mt-8 font-bold">{undangan.nama_penandatangan}</p>
                          <p>NIK. {undangan.nik_penandatangan}</p>
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
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Form SK Mutasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nomor SK</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={skMutasi.nomor_surat} onChange={e => setSkMutasi(p => ({...p, nomor_surat: e.target.value}))} placeholder="001/SK-MUT/PERUMDAM-TIARA/III/2026" className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => handleGenerateNomor(setSkMutasi, "nomor_surat")}>Auto</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Pegawai *</Label>
                      <Input className="mt-1" value={skMutasi.nama_pegawai} onChange={e => setSkMutasi(p => ({...p, nama_pegawai: e.target.value}))} />
                    </div>
                    <div>
                      <Label>Tanggal Efektif</Label>
                      <Input className="mt-1" type="date" value={skMutasi.tanggal_efektif} onChange={e => setSkMutasi(p => ({...p, tanggal_efektif: e.target.value}))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Jabatan Asal</Label>
                      <Input className="mt-1" value={skMutasi.jabatan_asal} onChange={e => setSkMutasi(p => ({...p, jabatan_asal: e.target.value}))} />
                    </div>
                    <div>
                      <Label>Jabatan Tujuan</Label>
                      <Input className="mt-1" value={skMutasi.jabatan_tujuan} onChange={e => setSkMutasi(p => ({...p, jabatan_tujuan: e.target.value}))} />
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/5 p-3 space-y-3">
                    <p className="text-xs font-semibold text-primary uppercase">Penandatangan</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nama *</Label>
                        <Input className="mt-1" value={skMutasi.nama_penandatangan} onChange={e => setSkMutasi(p => ({...p, nama_penandatangan: e.target.value}))} />
                      </div>
                      <div>
                        <Label>NIK</Label>
                        <Input className="mt-1 font-mono" value={skMutasi.nik_penandatangan} onChange={e => setSkMutasi(p => ({...p, nik_penandatangan: e.target.value}))} />
                      </div>
                    </div>
                  </div>

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
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Form Surat Peringatan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Jenis SP</Label>
                    <Select value={sp.jenis_sp} onValueChange={v => setSp(p => ({...p, jenis_sp: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Surat Peringatan Pertama (SP-1)">SP-1 (Peringatan Pertama)</SelectItem>
                        <SelectItem value="Surat Peringatan Kedua (SP-2)">SP-2 (Peringatan Kedua)</SelectItem>
                        <SelectItem value="Surat Peringatan Ketiga (SP-3)">SP-3 (Peringatan Ketiga)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Nomor Surat</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={sp.nomor_surat} onChange={e => setSp(p => ({...p, nomor_surat: e.target.value}))} className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => handleGenerateNomor(setSp, "nomor_surat")}>Auto</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Pegawai *</Label>
                      <Input className="mt-1" value={sp.nama_pegawai} onChange={e => setSp(p => ({...p, nama_pegawai: e.target.value}))} />
                    </div>
                    <div>
                      <Label>Jabatan</Label>
                      <Input className="mt-1" value={sp.jabatan} onChange={e => setSp(p => ({...p, jabatan: e.target.value}))} />
                    </div>
                  </div>

                  <div>
                    <Label>Alasan / Pelanggaran *</Label>
                    <Textarea className="mt-1" rows={3} value={sp.alasan} onChange={e => setSp(p => ({...p, alasan: e.target.value}))} placeholder="Jelaskan pelanggaran yang dilakukan..." />
                  </div>

                  <div className="rounded-lg bg-primary/5 p-3 space-y-3">
                    <p className="text-xs font-semibold text-primary uppercase">Penandatangan</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nama *</Label>
                        <Input className="mt-1" value={sp.nama_penandatangan} onChange={e => setSp(p => ({...p, nama_penandatangan: e.target.value}))} />
                      </div>
                      <div>
                        <Label>NIK</Label>
                        <Input className="mt-1 font-mono" value={sp.nik_penandatangan} onChange={e => setSp(p => ({...p, nik_penandatangan: e.target.value}))} />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full gap-2" onClick={handleDownloadSP} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Download className="h-4 w-4" />Download Surat Peringatan (.docx)</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
```

---

## CATATAN PENTING

1. File `template_surat_lengkap.docx` harus disimpan di `public/templates/`
2. Template sudah berisi kop surat asli + footer dari file yang kamu upload
3. Placeholder menggunakan format `{nama_field}` yang diisi otomatis
4. Hasil download adalah file `.docx` yang bisa dibuka di Word dan diedit
5. Untuk menambah jenis surat baru, cukup tambah fungsi template baru di `lib/actions/surat.ts`
