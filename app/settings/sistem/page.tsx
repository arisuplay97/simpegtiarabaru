"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Clock, CalendarDays, Wallet, Building2, FileSignature } from "lucide-react"
import { getPengaturan, updatePengaturan } from "@/lib/actions/pengaturan"

export default function PengaturanSistemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    jamMasuk: "08:00",
    jamPulang: "17:00",
    batasTerlambat: 15,
    lokasiPusat: "",
    jatahCutiTahunan: 12,
    batasBawaCuti: 0,
    tanggalGajian: 25,
    bpjsKesehatanPcs: 1.0,
    bpjsTkPcs: 2.0,
    namaPerusahaan: "Tirta Ardhia Rinjani",
    alamatPerusahaan: "",
    logoUrl: "",
    formatNomorSK: "SK/[NOMOR]/[BULAN]/[TAHUN]",
    namaPenandatangan: "Direktur Utama",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "HRD") {
        router.push("/dashboard")
        toast.error("Akses ditolak")
      } else {
        fetchData()
      }
    }
  }, [status, session])

  const fetchData = async () => {
    setIsLoading(true)
    const res = await getPengaturan()
    if (res.data) {
      setFormData(res.data)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Konversi tipe data numerik
    const payload = {
      ...formData,
      batasTerlambat: parseInt(formData.batasTerlambat) || 0,
      jatahCutiTahunan: parseInt(formData.jatahCutiTahunan) || 0,
      batasBawaCuti: parseInt(formData.batasBawaCuti) || 0,
      tanggalGajian: parseInt(formData.tanggalGajian) || 1,
      bpjsKesehatanPcs: parseFloat(formData.bpjsKesehatanPcs) || 0,
      bpjsTkPcs: parseFloat(formData.bpjsTkPcs) || 0,
    }

    const res = await updatePengaturan(payload)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Pengaturan sistem berhasil disimpan")
      setFormData(res.data)
    }
    setIsSaving(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (isLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Pengaturan", "Sistem"]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem</h1>
              <p className="text-sm text-muted-foreground">
                Konfigurasi Parameter Utama Sistem HRIS
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </div>

          <Tabs defaultValue="absensi" className="w-full">
            <TabsList className="mb-4 grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="absensi" className="gap-2"><Clock className="h-4 w-4" /> Absensi</TabsTrigger>
              <TabsTrigger value="cuti" className="gap-2"><CalendarDays className="h-4 w-4" /> Cuti</TabsTrigger>
              <TabsTrigger value="payroll" className="gap-2"><Wallet className="h-4 w-4" /> Payroll</TabsTrigger>
              <TabsTrigger value="organisasi" className="gap-2"><Building2 className="h-4 w-4" /> Organisasi</TabsTrigger>
              <TabsTrigger value="dokumen" className="gap-2"><FileSignature className="h-4 w-4" /> Dokumen</TabsTrigger>
            </TabsList>

            {/* TAB ABSENSI */}
            <TabsContent value="absensi">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Kehadiran & Waktu Kerja</CardTitle>
                  <CardDescription>Aturan default jam operasional untuk mendeteksi keterlambatan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="jamMasuk">Jam Masuk</Label>
                      <Input type="time" id="jamMasuk" name="jamMasuk" value={formData.jamMasuk || ""} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jamPulang">Jam Pulang</Label>
                      <Input type="time" id="jamPulang" name="jamPulang" value={formData.jamPulang || ""} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-2">
                       <Label htmlFor="batasCheckin" className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-amber-500" />
                         Batas Maksimal Check-in
                       </Label>
                       <Input 
                         type="time" 
                         id="batasCheckin" 
                         name="batasCheckin" 
                         value={formData.batasCheckin || "16:00"} 
                         onChange={handleChange} 
                         className="w-full sm:w-40"
                       />
                       <p className="text-xs text-muted-foreground italic">
                         Pegawai tidak bisa check-in setelah jam ini. Contoh: jika diset 16:00, absen jam 16:01 akan ditolak.
                       </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lokasiPusat">Titik Ordinat Koordinat Pusat (Opsional)</Label>
                    <Input id="lokasiPusat" name="lokasiPusat" value={formData.lokasiPusat || ""} onChange={handleChange} placeholder="-6.200000, 106.816666" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CUTI */}
            <TabsContent value="cuti">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Kebijakan Cuti</CardTitle>
                  <CardDescription>Konfigurasi jatah cuti karyawan setiap periode/tahun.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jatahCutiTahunan">Jatah Cuti Tahunan (Hari)</Label>
                    <Input type="number" id="jatahCutiTahunan" name="jatahCutiTahunan" value={formData.jatahCutiTahunan} onChange={handleChange} />
                    <p className="text-xs text-muted-foreground">Default saldo awal tahun untuk tiap pegawai.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batasBawaCuti">Batas Bawa Sisa Cuti Tahun Lalu</Label>
                    <Input type="number" id="batasBawaCuti" name="batasBawaCuti" value={formData.batasBawaCuti} onChange={handleChange} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB PAYROLL */}
            <TabsContent value="payroll">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Penggajian & BPJS</CardTitle>
                  <CardDescription>Variable tetap untuk kalkulasi payroll bulanan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggalGajian">Tanggal Gajian (Setiap Bulan)</Label>
                    <Input type="number" min="1" max="31" id="tanggalGajian" name="tanggalGajian" value={formData.tanggalGajian} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bpjsKesehatanPcs">Potongan BPJS Kesehatan (%)</Label>
                      <Input type="number" step="0.1" id="bpjsKesehatanPcs" name="bpjsKesehatanPcs" value={formData.bpjsKesehatanPcs} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bpjsTkPcs">Potongan BPJS Ketenagakerjaan (%)</Label>
                      <Input type="number" step="0.1" id="bpjsTkPcs" name="bpjsTkPcs" value={formData.bpjsTkPcs} onChange={handleChange} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB ORGANISASI */}
            <TabsContent value="organisasi">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Profil Perusahaan</CardTitle>
                  <CardDescription>Data instansi yang akan dicetak di berbagai laporan/surat.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaPerusahaan">Nama Entitas / Perusahaan</Label>
                    <Input id="namaPerusahaan" name="namaPerusahaan" value={formData.namaPerusahaan || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamatPerusahaan">Alamat Lengkap</Label>
                    <Input id="alamatPerusahaan" name="alamatPerusahaan" value={formData.alamatPerusahaan || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <Input id="logoUrl" name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB DOKUMEN */}
            <TabsContent value="dokumen">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Dokumen & Surat Keputusan (SK)</CardTitle>
                  <CardDescription>Pengaturan template penomoran dan penandatangan dokumen sah.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="formatNomorSK">Format Penomoran Otomatis SK</Label>
                    <Input id="formatNomorSK" name="formatNomorSK" value={formData.formatNomorSK || ""} onChange={handleChange} />
                    <p className="text-xs text-muted-foreground">Gunakan [NOMOR], [BULAN], [TAHUN] sebagai variabel.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="namaPenandatangan">Nama/Jabatan Penandatangan Default</Label>
                    <Input id="namaPenandatangan" name="namaPenandatangan" value={formData.namaPenandatangan || ""} onChange={handleChange} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
