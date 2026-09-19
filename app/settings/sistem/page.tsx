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
import { Loader2, Save, Clock, CalendarDays, Wallet, Building2, FileSignature, Bot } from "lucide-react"
import { getPengaturan, updatePengaturan } from "@/lib/actions/pengaturan"

export default function PengaturanSistemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    jamMasuk: "08:00",
    jamPulang: "17:00",
    mulaiAbsenMasuk: "06:30",
    batasAbsenMasuk: "14:00",
    mulaiAbsenPulang: "15:00",
    batasAbsenPulang: "18:00",
    batasTerlambat: 15,
    lokasiPusat: "",
    // Cabang (Senin - Jumat)
    jamMasukCabang: "08:00",
    jamPulangCabang: "16:30",
    mulaiAbsenMasukCabang: "06:30",
    batasAbsenMasukCabang: "14:00",
    mulaiAbsenPulangCabang: "15:00",
    batasAbsenPulangCabang: "18:00",
    // Khusus Hari Sabtu (Cabang)
    aktifSabtuCabang: true,
    jamMasukSabtuCabang: "08:00",
    jamPulangSabtuCabang: "13:00",
    mulaiMasukSabtuCabang: "06:30",
    batasMasukSabtuCabang: "11:00",
    mulaiPulangSabtuCabang: "12:00",
    batasPulangSabtuCabang: "15:00",
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
    dendaTerlambat: 5000,
    batasTerlambatDenda: 5,
    dendaAlpa: 7500,
    tunjanganTransport: 120000,
    batasAlpaDendaTransport: 3,
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
      dendaTerlambat: parseInt(formData.dendaTerlambat) || 0,
      batasTerlambatDenda: parseInt(formData.batasTerlambatDenda) || 0,
      dendaAlpa: parseInt(formData.dendaAlpa) || 0,
      tunjanganTransport: parseInt(formData.tunjanganTransport) || 0,
      batasAlpaDendaTransport: parseInt(formData.batasAlpaDendaTransport) || 0,
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
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/settings/ai")}
                className="gap-2 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Bot className="h-4 w-4 text-blue-500" />
                AI Assistant & API
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Perubahan
              </Button>
            </div>
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
            <TabsContent value="absensi" className="space-y-6">
              {/* KANTOR PUSAT */}
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Kantor Pusat (Senin - Jumat)</CardTitle>
                      <CardDescription>Jadwal operasional kerja 5 hari untuk staf kantor pusat.</CardDescription>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-blue-50/40 dark:bg-blue-950/20 p-4 border-blue-200/70 dark:border-blue-900/50">
                    <div className="space-y-2">
                       <Label htmlFor="mulaiAbsenMasuk" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-blue-500" />
                         Mulai Buka Check-in
                       </Label>
                       <Input 
                         type="time" 
                         id="mulaiAbsenMasuk" 
                         name="mulaiAbsenMasuk" 
                         value={formData.mulaiAbsenMasuk || "06:30"} 
                         onChange={handleChange} 
                       />
                       <p className="text-[10px] text-muted-foreground italic">
                         Sebelum jam ini absen ditolak.
                       </p>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="batasAbsenMasuk" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-amber-500" />
                         Batas Maksimal Check-in
                       </Label>
                       <Input 
                         type="time" 
                         id="batasAbsenMasuk" 
                         name="batasAbsenMasuk" 
                         value={formData.batasAbsenMasuk || "14:00"} 
                         onChange={handleChange} 
                       />
                       <p className="text-[10px] text-muted-foreground italic">
                         Lewat jam ini ditolak check-in.
                       </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-2">
                       <Label htmlFor="mulaiAbsenPulang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-emerald-500" />
                         Mulai Buka Check-out
                       </Label>
                       <Input 
                         type="time" 
                         id="mulaiAbsenPulang" 
                         name="mulaiAbsenPulang" 
                         value={formData.mulaiAbsenPulang || "15:00"} 
                         onChange={handleChange} 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="batasAbsenPulang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-red-500" />
                         Tutup Sesi Check-out
                       </Label>
                       <Input 
                         type="time" 
                         id="batasAbsenPulang" 
                         name="batasAbsenPulang" 
                         value={formData.batasAbsenPulang || "18:00"} 
                         onChange={handleChange} 
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batasTerlambat">Toleransi Keterlambatan (Menit)</Label>
                    <Input type="number" id="batasTerlambat" name="batasTerlambat" value={formData.batasTerlambat ?? 15} onChange={handleChange} />
                  </div>
                </CardContent>
              </Card>

              {/* KANTOR CABANG (SENIN - JUMAT) */}
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Kantor Cabang (Senin - Jumat)</CardTitle>
                      <CardDescription>Jadwal operasional kerja weekday untuk seluruh pekerja di kantor cabang.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="jamMasukCabang">Jam Masuk Cabang</Label>
                      <Input type="time" id="jamMasukCabang" name="jamMasukCabang" value={formData.jamMasukCabang || "08:00"} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jamPulangCabang">Jam Pulang Cabang</Label>
                      <Input type="time" id="jamPulangCabang" name="jamPulangCabang" value={formData.jamPulangCabang || "16:30"} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 p-4 border-emerald-200/70 dark:border-emerald-900/50">
                    <div className="space-y-2">
                       <Label htmlFor="mulaiAbsenMasukCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-emerald-500" />
                         Mulai Buka Check-in Cabang
                       </Label>
                       <Input 
                         type="time" 
                         id="mulaiAbsenMasukCabang" 
                         name="mulaiAbsenMasukCabang" 
                         value={formData.mulaiAbsenMasukCabang || "06:30"} 
                         onChange={handleChange} 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="batasAbsenMasukCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-amber-500" />
                         Batas Maksimal Check-in Cabang
                       </Label>
                       <Input 
                         type="time" 
                         id="batasAbsenMasukCabang" 
                         name="batasAbsenMasukCabang" 
                         value={formData.batasAbsenMasukCabang || "14:00"} 
                         onChange={handleChange} 
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-2">
                       <Label htmlFor="mulaiAbsenPulangCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-teal-500" />
                         Mulai Buka Check-out Cabang
                       </Label>
                       <Input 
                         type="time" 
                         id="mulaiAbsenPulangCabang" 
                         name="mulaiAbsenPulangCabang" 
                         value={formData.mulaiAbsenPulangCabang || "15:00"} 
                         onChange={handleChange} 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="batasAbsenPulangCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-rose-500" />
                         Tutup Sesi Check-out Cabang
                       </Label>
                       <Input 
                         type="time" 
                         id="batasAbsenPulangCabang" 
                         name="batasAbsenPulangCabang" 
                         value={formData.batasAbsenPulangCabang || "18:00"} 
                         onChange={handleChange} 
                       />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KHUSUS HARI SABTU (KANTOR CABANG) */}
              <Card className="card-premium border-amber-200/80 dark:border-amber-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          Pengaturan Khusus Hari Sabtu
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold uppercase">
                            Kantor Cabang
                          </span>
                        </CardTitle>
                        <CardDescription>Pekerja kantor cabang berjadwal Senin s.d. Sabtu (6 hari kerja aktif).</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="jamMasukSabtuCabang">Jam Masuk Sabtu</Label>
                      <Input type="time" id="jamMasukSabtuCabang" name="jamMasukSabtuCabang" value={formData.jamMasukSabtuCabang || "08:00"} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jamPulangSabtuCabang">Jam Pulang Sabtu</Label>
                      <Input type="time" id="jamPulangSabtuCabang" name="jamPulangSabtuCabang" value={formData.jamPulangSabtuCabang || "13:00"} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-amber-50/40 dark:bg-amber-950/20 p-4 border-amber-200/70 dark:border-amber-900/50">
                    <div className="space-y-2">
                       <Label htmlFor="mulaiMasukSabtuCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-amber-600" />
                         Mulai Buka Check-in Sabtu
                       </Label>
                       <Input 
                         type="time" 
                         id="mulaiMasukSabtuCabang" 
                         name="mulaiMasukSabtuCabang" 
                         value={formData.mulaiMasukSabtuCabang || "06:30"} 
                         onChange={handleChange} 
                       />
                       <p className="text-[10px] text-muted-foreground italic">
                         Sesi check-in Sabtu mulai dibuka.
                       </p>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="batasMasukSabtuCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-red-500" />
                         Batas Maksimal Check-in Sabtu
                       </Label>
                       <Input 
                         type="time" 
                         id="batasMasukSabtuCabang" 
                         name="batasMasukSabtuCabang" 
                         value={formData.batasMasukSabtuCabang || "11:00"} 
                         onChange={handleChange} 
                       />
                       <p className="text-[10px] text-muted-foreground italic">
                         Lewat jam ini check-in Sabtu ditutup.
                       </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-2">
                       <Label htmlFor="mulaiPulangSabtuCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-emerald-500" />
                         Mulai Buka Check-out Sabtu
                       </Label>
                       <Input 
                         type="time" 
                         id="mulaiPulangSabtuCabang" 
                         name="mulaiPulangSabtuCabang" 
                         value={formData.mulaiPulangSabtuCabang || "12:00"} 
                         onChange={handleChange} 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="batasPulangSabtuCabang" className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="h-4 w-4 text-rose-500" />
                         Tutup Sesi Check-out Sabtu
                       </Label>
                       <Input 
                         type="time" 
                         id="batasPulangSabtuCabang" 
                         name="batasPulangSabtuCabang" 
                         value={formData.batasPulangSabtuCabang || "15:00"} 
                         onChange={handleChange} 
                       />
                    </div>
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

                  <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tunjanganTransport">Tunjangan Transport (Rp)</Label>
                      <Input type="number" id="tunjanganTransport" name="tunjanganTransport" value={formData.tunjanganTransport} onChange={handleChange} />
                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight italic">Besaran tunjangan transport yang akan di-lock (default: 120.000)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batasAlpaDendaTransport">Batas Alpa Tunjangan Lenyap (Hari)</Label>
                      <Input type="number" id="batasAlpaDendaTransport" name="batasAlpaDendaTransport" value={formData.batasAlpaDendaTransport} onChange={handleChange} />
                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight italic">Jika alpa mencapai X kali, tunjangan transport Rp. {Number(formData.tunjanganTransport).toLocaleString('id-ID')} akan dipotong habis.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dendaTerlambat">Denda Terlambat (Rp per Kejadian)</Label>
                      <Input type="number" id="dendaTerlambat" name="dendaTerlambat" value={formData.dendaTerlambat} onChange={handleChange} />
                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight italic">Denda flat setiap kali terlambat melebihi batas (misal: 5.000)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batasTerlambatDenda">Batas Menit Mulai Denda (Menit)</Label>
                      <Input type="number" id="batasTerlambatDenda" name="batasTerlambatDenda" value={formData.batasTerlambatDenda} onChange={handleChange} />
                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight italic">Denda baru dikenakan jika telat lebih dari X menit dari jadwal (misal: 5)</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="dendaAlpa">Denda Alpa Harian (Rp)</Label>
                    <Input type="number" id="dendaAlpa" name="dendaAlpa" value={formData.dendaAlpa} onChange={handleChange} />
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight italic">Denda per hari jika status ALPA (Tanpa Keterangan). (Misal: 7.500)</p>
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
