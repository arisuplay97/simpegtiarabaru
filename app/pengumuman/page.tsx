"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell, Megaphone, Send, Trash2, Users,
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Radio, Image as ImageIcon, UploadCloud, Calendar,
  Smartphone, X, Check, Clock, Wifi, BatteryCharging,
  Info, Eye, ChevronRight, Zap
} from "lucide-react"
import {
  getPengumumanAktif,
  broadcastPengumuman,
  hapusPengumuman
} from "@/lib/actions/notifikasi"
import {
  getBannersPwa,
  createBannerPwa,
  deleteBannerPwa,
  toggleBannerPwa,
  restoreDefaultBannerPwa,
  BannerItem
} from "@/lib/actions/banner"
import { BannerCarousel } from "@/components/simpeg/banner-carousel"
import { compressImageForMobile, formatFileSize } from "@/lib/utils/image-compression"
import { toast } from "sonner"
import { format, addDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export default function PengumumanPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canManage = ["SUPERADMIN", "HRD", "DIREKSI"].includes(role)

  const [activeTab, setActiveTab] = useState<string>("banner")

  // ===== STATE TICKER PENGUMUMAN =====
  const [pengumumanList, setPengumumanList] = useState<any[]>([])
  const [isLoadingTicker, setIsLoadingTicker] = useState(true)
  const [isSendingTicker, setIsSendingTicker] = useState(false)
  const [isDeletingTicker, setIsDeletingTicker] = useState<string | null>(null)
  const [tickerTitle, setTickerTitle] = useState("")
  const [tickerMessage, setTickerMessage] = useState("")

  // ===== STATE BANNER PWA =====
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [isLoadingBanners, setIsLoadingBanners] = useState(true)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isDeletingBanner, setIsDeletingBanner] = useState<string | null>(null)

  // Form banner fields
  const [bannerJudul, setBannerJudul] = useState("")
  const [bannerSampai, setBannerSampai] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number
    compressedSize: number
    savedPercent: number
    isCompressing: boolean
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data Ticker Pengumuman
  const loadTicker = useCallback(async () => {
    setIsLoadingTicker(true)
    try {
      const data = await getPengumumanAktif()
      setPengumumanList(data)
    } finally {
      setIsLoadingTicker(false)
    }
  }, [])

  // Load data Banner PWA
  const loadBanners = useCallback(async () => {
    setIsLoadingBanners(true)
    try {
      const data = await getBannersPwa(false)
      setBanners(data)
    } finally {
      setIsLoadingBanners(false)
    }
  }, [])

  const reloadAll = useCallback(() => {
    loadTicker()
    loadBanners()
  }, [loadTicker, loadBanners])

  useEffect(() => {
    reloadAll()
  }, [reloadAll])

  // File selection & automatic client-side compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran awal (maks 15MB sebelum kompresi)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 15MB")
      return
    }

    // Validasi tipe file
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast.error("Format file harus JPG, PNG, WebP, atau GIF")
      return
    }

    setCompressionInfo({
      originalSize: file.size,
      compressedSize: file.size,
      savedPercent: 0,
      isCompressing: true,
    })

    try {
      // Kompresi cerdas: otomatis me-resize ke lebar ideal mobile (maks 1200px) dan convert ke WebP
      const result = await compressImageForMobile(file, 1200, 600, 0.82)
      setSelectedFile(result.file)
      const localUrl = URL.createObjectURL(result.file)
      setPreviewUrl(localUrl)

      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savedPercent: result.savedPercent,
        isCompressing: false,
      })

      if (result.savedPercent > 0) {
        toast.success(
          `Gambar banner dioptimalkan! Hemat ${result.savedPercent}% (${formatFileSize(result.originalSize)} ➔ ${formatFileSize(result.compressedSize)})`
        )
      }
    } catch {
      // Fallback jika proses kompresi browser tidak didukung
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setCompressionInfo(null)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setCompressionInfo(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Set quick date helpers
  const handleSetQuickDate = (days: number | null) => {
    if (days === null) {
      setBannerSampai("")
    } else {
      const target = addDays(new Date(), days)
      setBannerSampai(format(target, "yyyy-MM-dd"))
    }
  }

  const [isRestoringDefault, setIsRestoringDefault] = useState(false)

  // Pulihkan Banner Default
  const handleRestoreDefault = async () => {
    setIsRestoringDefault(true)
    const toastId = toast.loading("Memulihkan banner bawaan...")
    try {
      const res = await restoreDefaultBannerPwa()
      if (res.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success("Banner bawaan berhasil dipulihkan!", { id: toastId })
        await loadBanners()
      }
    } catch {
      toast.error("Gagal memulihkan banner", { id: toastId })
    } finally {
      setIsRestoringDefault(false)
    }
  }

  // Handle Upload Banner
  const handleUploadBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error("Pilih file gambar banner terlebih dahulu")
      return
    }

    setIsUploadingBanner(true)
    const toastId = toast.loading("Mengunggah dan memproses banner...")
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (bannerJudul.trim()) formData.append("judul", bannerJudul.trim())
      if (bannerSampai) formData.append("tampilkanSampai", bannerSampai)

      // Coba lewat dedicated API route (lebih stabil untuk multipart file)
      let resData: any = null
      try {
        const apiRes = await fetch("/api/banner/upload", {
          method: "POST",
          body: formData,
        })
        resData = await apiRes.json()
      } catch {
        // Fallback ke server action jika fetch API route gagal
        resData = await createBannerPwa(formData)
      }

      if (resData?.error) {
        toast.error(resData.error, { id: toastId })
      } else {
        toast.success("Banner berhasil diunggah dan ditayangkan di PWA Mobile!", { id: toastId })
        // Reset form
        handleClearFile()
        setBannerJudul("")
        setBannerSampai("")
        await loadBanners()
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah banner", { id: toastId })
    } finally {
      setIsUploadingBanner(false)
    }
  }

  // Handle Delete Banner
  const handleDeleteBanner = async (id: string, judul: string | null) => {
    const confirmName = judul || "banner ini"
    if (!window.confirm(`Yakin ingin menghapus ${confirmName}? Banner tidak akan tampil lagi di PWA.`)) {
      return
    }

    setIsDeletingBanner(id)
    try {
      const res = await deleteBannerPwa(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Banner berhasil dihapus")
        await loadBanners()
      }
    } finally {
      setIsDeletingBanner(null)
    }
  }

  // Handle Toggle Aktif
  const handleToggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleBannerPwa(id, !currentStatus)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(!currentStatus ? "Banner diaktifkan" : "Banner dinonaktifkan")
        await loadBanners()
      }
    } catch {
      toast.error("Gagal mengubah status banner")
    }
  }

  // Handle Ticker Pengumuman
  const handleSendTicker = async () => {
    if (!tickerTitle.trim() || !tickerMessage.trim()) {
      toast.error("Judul dan isi pengumuman harus diisi")
      return
    }
    setIsSendingTicker(true)
    try {
      const res = await broadcastPengumuman(tickerTitle.trim(), tickerMessage.trim())
      if ((res as any).error) {
        toast.error((res as any).error)
      } else {
        toast.success(`Pengumuman berhasil dikirim ke ${(res as any).count} pegawai`)
        setTickerTitle("")
        setTickerMessage("")
        await loadTicker()
      }
    } finally {
      setIsSendingTicker(false)
    }
  }

  const handleDeleteTicker = async (t: string, m: string, key: string) => {
    setIsDeletingTicker(key)
    try {
      const res = await hapusPengumuman(t, m)
      if ((res as any).error) {
        toast.error((res as any).error)
      } else {
        toast.success("Pengumuman berhasil dihapus")
        await loadTicker()
      }
    } finally {
      setIsDeletingTicker(null)
    }
  }

  // Hitung banner aktif untuk live preview di HP
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const activeBanners = banners.filter((b) => {
    if (!b.aktif) return false
    if (!b.tampilkanSampai) return true
    return new Date(b.tampilkanSampai) >= startOfToday
  })

  // Format tanggal hari ini untuk batas minimal date picker
  const todayStr = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Pengumuman Berjalan"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-primary" />
                Pengaturan Pengumuman & Banner PWA
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola banner bergambar yang otomatis bergeser di aplikasi HP (PWA) serta teks ticker berjalan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reloadAll}
              disabled={isLoadingTicker || isLoadingBanners}
              className="self-start sm:self-auto gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${(isLoadingTicker || isLoadingBanners) ? "animate-spin" : ""}`} />
              Segarkan Data
            </Button>
          </div>

          {/* Tabs Navigasi */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/70 rounded-xl">
              <TabsTrigger value="banner" className="flex items-center justify-center gap-2 font-semibold">
                <ImageIcon className="h-4 w-4" />
                <span>Banner Gambar PWA</span>
                {banners.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                    {banners.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ticker" className="flex items-center justify-center gap-2 font-semibold">
                <Radio className="h-4 w-4" />
                <span>Ticker Teks Berjalan</span>
                {pengumumanList.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                    {pengumumanList.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ========================================================= */}
            {/* TAB 1: BANNER GAMBAR PWA MOBILE (FITUR UTAMA BARU)       */}
            {/* ========================================================= */}
            <TabsContent value="banner" className="space-y-6 m-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Kolom Kiri: Form Upload & Daftar Banner (7 Kolom) */}
                <div className="lg:col-span-7 space-y-6">

                  {/* Form Upload Banner Baru */}
                  <Card className="card-premium border-primary/20 shadow-xs">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2 text-foreground">
                          <UploadCloud className="h-5 w-5 text-primary" />
                          Upload Banner Gambar PWA
                        </span>
                        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                          Auto-Slide di Mobile
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Banner yang diunggah akan otomatis bergeser jika terdapat lebih dari 1 gambar aktif.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!canManage && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Hanya Admin, HRD, dan Direksi yang dapat mengunggah atau mengelola banner.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Dropzone / File Picker */}
                      <div className="space-y-2">
                        <Label htmlFor="bannerFile" className="text-xs font-semibold">
                          File Gambar Banner <span className="text-red-500">*</span>
                        </Label>
                        
                        {!previewUrl ? (
                          <label
                            htmlFor="bannerFile"
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                              canManage
                                ? "border-muted-foreground/25 hover:border-primary/60 hover:bg-primary/5 bg-muted/10"
                                : "opacity-60 cursor-not-allowed border-muted"
                            }`}
                          >
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-semibold text-foreground text-center">
                              Klik untuk memilih atau seret gambar ke sini
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 text-center">
                              Rasio disarankan 16:7 atau 2:1 (misal 800×350 px). Mendukung JPG, PNG, WebP, GIF.
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              <Zap className="h-3 w-3" />
                              <span>Auto-Compression Aktif (Otomatis dikecilkan ke WebP agar PWA ringan)</span>
                            </div>
                            <input
                              id="bannerFile"
                              ref={fileInputRef}
                              type="file"
                              accept="image/png, image/jpeg, image/webp, image/gif"
                              onChange={handleFileChange}
                              disabled={!canManage || isUploadingBanner}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20 p-2.5 space-y-2">
                            <div className="relative aspect-[16/7] w-full rounded-lg overflow-hidden bg-black/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewUrl}
                                alt="Pratinjau Banner Baru"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between px-1">
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate text-foreground flex items-center gap-1.5">
                                  {selectedFile?.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Ukuran upload: {formatFileSize(selectedFile?.size || 0)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFile}
                                disabled={isUploadingBanner}
                                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Ganti Gambar
                              </Button>
                            </div>

                            {/* Badge Hasil Kompresi */}
                            {compressionInfo && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                                <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  {compressionInfo.isCompressing ? (
                                    <span className="flex items-center gap-1.5">
                                      <Loader2 className="h-3 w-3 animate-spin" /> Sedang mengompresi gambar...
                                    </span>
                                  ) : compressionInfo.savedPercent > 0 ? (
                                    <span>
                                      <strong>Teroptimasi untuk PWA:</strong> Ukuran asli {formatFileSize(compressionInfo.originalSize)} ➔{" "}
                                      <strong className="text-emerald-700 dark:text-emerald-300">{formatFileSize(compressionInfo.compressedSize)}</strong>{" "}
                                      <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px] ml-1 py-0">
                                        Hemat {compressionInfo.savedPercent}%
                                      </Badge>
                                    </span>
                                  ) : (
                                    <span>Gambar sudah dalam ukuran optimal ({formatFileSize(compressionInfo.compressedSize)})</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Judul / Keterangan Banner */}
                      <div className="space-y-1.5">
                        <Label htmlFor="bannerJudul" className="text-xs font-semibold">
                          Judul / Keterangan Banner <span className="text-muted-foreground font-normal">(Opsional)</span>
                        </Label>
                        <Input
                          id="bannerJudul"
                          placeholder="contoh: Pengingat Absensi Masuk & Pulang, Sosialisasi Cuti..."
                          value={bannerJudul}
                          onChange={(e) => setBannerJudul(e.target.value)}
                          disabled={!canManage || isUploadingBanner}
                          maxLength={100}
                        />
                      </div>

                      {/* Batas Tanggal Tampil */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="bannerSampai" className="text-xs font-semibold flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Tampilkan Sampai Tanggal
                            <span className="text-muted-foreground font-normal">(Opsional)</span>
                          </Label>
                          {bannerSampai && (
                            <button
                              type="button"
                              onClick={() => handleSetQuickDate(null)}
                              className="text-[11px] text-primary hover:underline"
                            >
                              Hapus Batas (Selamanya)
                            </button>
                          )}
                        </div>

                        <Input
                          id="bannerSampai"
                          type="date"
                          min={todayStr}
                          value={bannerSampai}
                          onChange={(e) => setBannerSampai(e.target.value)}
                          disabled={!canManage || isUploadingBanner}
                          className="w-full"
                        />

                        {/* Quick Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground mr-1">Opsi cepat:</span>
                          <button
                            type="button"
                            onClick={() => handleSetQuickDate(null)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                              !bannerSampai
                                ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            Selamanya
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetQuickDate(7)}
                            className="text-[10px] px-2 py-0.5 rounded-full border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            +7 Hari
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetQuickDate(14)}
                            className="text-[10px] px-2 py-0.5 rounded-full border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            +14 Hari
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetQuickDate(30)}
                            className="text-[10px] px-2 py-0.5 rounded-full border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            +30 Hari
                          </button>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          {bannerSampai ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Banner akan otomatis berhenti tayang setelah tanggal{" "}
                              {format(new Date(bannerSampai), "dd MMMM yyyy", { locale: idLocale })}.
                            </span>
                          ) : (
                            "Jika dikosongkan, banner akan terus ditampilkan selamanya tanpa batas waktu."
                          )}
                        </p>
                      </div>

                      {/* Tombol Simpan */}
                      <Button
                        onClick={handleUploadBanner}
                        disabled={!canManage || isUploadingBanner || !selectedFile}
                        className="w-full gap-2 mt-2"
                      >
                        {isUploadingBanner ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sedang Mengunggah...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            Upload & Terbitkan Banner PWA
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Daftar Banner Terdaftar */}
                  <Card className="card-premium">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            Daftar Banner PWA
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {activeBanners.length} aktif dari total {banners.length} banner
                          </CardDescription>
                        </div>
                        {activeBanners.length > 1 && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
                            Auto-Slide Berjalan (4s)
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingBanners ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : banners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                          <p className="text-sm font-medium text-foreground">Belum ada banner terdaftar</p>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            Unggah gambar banner baru pada form di atas, atau klik tombol di bawah untuk memunculkan kembali banner absensi bawaan.
                          </p>
                          {canManage && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={handleRestoreDefault}
                              disabled={isRestoringDefault}
                            >
                              {isRestoringDefault ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Pulihkan Banner Default (/op.png)
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {banners.map((b) => {
                            const isDefault = b.imageUrl === "/op.png"
                            const isExpired = b.tampilkanSampai
                              ? new Date(b.tampilkanSampai) < startOfToday
                              : false
                            const isActive = b.aktif && !isExpired

                            return (
                              <div
                                key={b.id}
                                className={`rounded-xl border p-3.5 transition-all ${
                                  isActive
                                    ? "bg-card border-border hover:border-primary/40 shadow-xs"
                                    : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-75"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                                  {/* Thumbnail */}
                                  <div className="relative w-full sm:w-36 aspect-[16/7] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-border/60">
                                    <Image
                                      src={b.imageUrl}
                                      alt={b.judul || "Banner"}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                    {isDefault && (
                                      <span className="absolute top-1 left-1 bg-blue-600/90 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.2 rounded-sm">
                                        Default
                                      </span>
                                    )}
                                  </div>

                                  {/* Detail Banner */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      {isActive ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px] px-1.5 py-0">
                                          🟢 Tayang di PWA
                                        </Badge>
                                      ) : isExpired ? (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 text-[10px] px-1.5 py-0">
                                          ⏳ Kedaluwarsa
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          ⚪ Nonaktif
                                        </Badge>
                                      )}

                                      {isDefault && (
                                        <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200 px-1.5 py-0">
                                          Banner Sistem
                                        </Badge>
                                      )}
                                    </div>

                                    <p className="text-sm font-bold text-foreground truncate">
                                      {b.judul || "Banner Tanpa Judul"}
                                    </p>

                                    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                                      <p className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                                        <span>
                                          Masa tayang:{" "}
                                          {b.tampilkanSampai ? (
                                            <span className={isExpired ? "text-red-500 font-semibold" : "font-medium text-foreground"}>
                                              s/d {format(new Date(b.tampilkanSampai), "dd MMMM yyyy", { locale: idLocale })}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                              Selamanya (Tanpa Batas)
                                            </span>
                                          )}
                                        </span>
                                      </p>
                                      <p className="text-[11px] text-muted-foreground/80">
                                        Diupload: {format(new Date(b.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Tombol Aksi */}
                                  {canManage && (
                                    <div className="flex items-center sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs px-2.5"
                                        onClick={() => handleToggleBanner(b.id, b.aktif)}
                                      >
                                        {b.aktif ? "Nonaktifkan" : "Aktifkan"}
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={() => handleDeleteBanner(b.id, b.judul)}
                                        disabled={isDeletingBanner === b.id}
                                        title="Hapus Banner"
                                      >
                                        {isDeletingBanner === b.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Kolom Kanan: Live Interactive Smartphone Preview (5 Kolom) */}
                <div className="lg:col-span-5 sticky top-6 space-y-4">
                  <Card className="card-premium border-primary/20 bg-gradient-to-b from-card to-muted/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2 text-foreground">
                          <Smartphone className="h-5 w-5 text-primary" />
                          Live Preview PWA Mobile
                        </CardTitle>
                        <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
                          {activeBanners.length > 1 ? "Auto-Slide 4s" : "1 Banner Statis"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Tampilan simulasi real-time seperti yang dilihat pegawai di dashboard mobile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pb-6">

                      {/* Mock Smartphone Frame */}
                      <div className="w-full max-w-[320px] rounded-[38px] border-[7px] border-zinc-800 dark:border-zinc-700 bg-zinc-950 p-2.5 shadow-2xl relative overflow-hidden">
                        
                        {/* Dynamic Island / Speaker Pill */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-30 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 mr-2" />
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                        </div>

                        {/* Screen Content */}
                        <div className="rounded-[30px] bg-zinc-50 dark:bg-zinc-900 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col min-h-[480px]">
                          
                          {/* Mock Status Bar */}
                          <div className="pt-2.5 px-4 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-tight text-zinc-600 dark:text-zinc-400 select-none">
                            <span>09:41</span>
                            <div className="flex items-center gap-1.5">
                              <Wifi className="h-3 w-3" />
                              <BatteryCharging className="h-3.5 w-3.5" />
                            </div>
                          </div>

                          {/* Mock Header SIMPEG */}
                          <div className="px-3.5 py-2.5 border-b border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold tracking-wider uppercase text-primary">SIMPEG TIARA</p>
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Hai, Pegawai</p>
                            </div>
                            <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                              P
                            </div>
                          </div>

                          {/* Inside Body */}
                          <div className="p-3 space-y-3 flex-1">
                            
                            {/* Live Banner Carousel */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-zinc-500 px-0.5">
                                <span className="font-semibold flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                  <Eye className="h-3 w-3 text-primary" /> Posisi Banner PWA:
                                </span>
                                {activeBanners.length > 1 && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                                    ● Berganti otomatis
                                  </span>
                                )}
                              </div>
                              
                              {activeBanners.length > 0 ? (
                                <BannerCarousel
                                  banners={activeBanners}
                                  autoSlideInterval={4000}
                                  aspectRatioClass="aspect-[16/7]"
                                />
                              ) : (
                                <div className="aspect-[16/7] rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center p-3 bg-zinc-50 dark:bg-zinc-800/40">
                                  <ImageIcon className="h-5 w-5 text-zinc-400 mb-1" />
                                  <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Tidak ada banner aktif</p>
                                  <p className="text-[9px] text-zinc-400">Banner yang aktif akan tampil di sini</p>
                                </div>
                              )}
                            </div>

                            {/* Mock Dashboard Widgets underneath */}
                            <div className="rounded-xl p-2.5 bg-white dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-500">Status Presensi Hari Ini</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                                  Tepat Waktu
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                                <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50">
                                  <p className="text-[9px] text-zinc-400 uppercase">Jam Masuk</p>
                                  <p className="font-bold text-zinc-800 dark:text-zinc-200">07:45</p>
                                </div>
                                <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50">
                                  <p className="text-[9px] text-zinc-400 uppercase">Jam Pulang</p>
                                  <p className="font-bold text-zinc-800 dark:text-zinc-200">--:--</p>
                                </div>
                              </div>
                            </div>

                            {/* Mock Quick Action Icons */}
                            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800">
                                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Cuti & Izin</p>
                              </div>
                              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800">
                                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Riwayat</p>
                              </div>
                              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800">
                                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Slip Gaji</p>
                              </div>
                            </div>

                          </div>

                          {/* Home Bar Indicator */}
                          <div className="py-2 flex justify-center">
                            <div className="w-24 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                          </div>

                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground text-center mt-3 max-w-[280px]">
                        Banner berganti otomatis setiap 4 detik saat ada lebih dari 1 banner aktif. Pegawai juga dapat menggeser layar (swipe).
                      </p>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 2: TICKER PENGUMUMAN (FITUR YANG SUDAH ADA)          */}
            {/* ========================================================= */}
            <TabsContent value="ticker" className="space-y-6 m-0">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Form Buat Pengumuman */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      Buat Pengumuman Ticker Baru
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pesan teks berjalan akan muncul pada bilah ticker di atas dashboard pegawai.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!canManage && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Hanya Admin, HRD, dan Direksi yang dapat mengirim pengumuman.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="tickerTitle">Judul Pengumuman</Label>
                      <Input
                        id="tickerTitle"
                        placeholder="contoh: Perhatian Pegawai"
                        value={tickerTitle}
                        onChange={e => setTickerTitle(e.target.value)}
                        disabled={!canManage || isSendingTicker}
                        maxLength={80}
                      />
                      <p className="text-[11px] text-muted-foreground">{tickerTitle.length}/80 karakter</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tickerMessage">Isi Pengumuman</Label>
                      <Textarea
                        id="tickerMessage"
                        placeholder="Tulis isi pengumuman di sini. Pesan ini akan berjalan (ticker) di layar mobile pegawai..."
                        value={tickerMessage}
                        onChange={e => setTickerMessage(e.target.value)}
                        disabled={!canManage || isSendingTicker}
                        rows={4}
                        maxLength={300}
                      />
                      <p className="text-[11px] text-muted-foreground">{tickerMessage.length}/300 karakter</p>
                    </div>

                    {/* Preview */}
                    {(tickerTitle || tickerMessage) && (
                      <div className="rounded-xl p-3 border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Radio className="h-3 w-3" /> Preview Ticker Mobile
                        </p>
                        <div className="flex items-center gap-2 text-[11px] overflow-hidden">
                          <Bell className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold text-blue-800 dark:text-blue-300 truncate shrink-0">{tickerTitle || "Judul"}</span>
                          <span className="text-blue-600 dark:text-blue-400 truncate">— {tickerMessage || "Pesan berjalan..."}</span>
                        </div>
                      </div>
                    )}

                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800">
                      <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
                        Pengumuman akan dikirim ke <strong>semua pegawai aktif</strong> dan muncul sebagai ticker berjalan di dashboard mobile selama 30 hari.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleSendTicker}
                      disabled={!canManage || isSendingTicker || !tickerTitle.trim() || !tickerMessage.trim()}
                      className="w-full gap-2"
                    >
                      {isSendingTicker ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
                      ) : (
                        <><Send className="h-4 w-4" /> Kirim ke Semua Pegawai</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Daftar Pengumuman Aktif */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      Pengumuman Ticker Aktif
                      {pengumumanList.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">{pengumumanList.length} aktif</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTicker ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : pengumumanList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                        <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Belum ada pengumuman aktif.</p>
                        <p className="text-xs text-muted-foreground">Buat pengumuman baru di form sebelah kiri.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pengumumanList.map((p) => {
                          const key = `${p.title}||${p.message}`
                          return (
                            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                      <Radio className="h-2.5 w-2.5 mr-0.5" /> SIARAN
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {format(new Date(p.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-foreground">{p.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{p.message}</p>
                                </div>
                                {canManage && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteTicker(p.title, p.message, key)}
                                    disabled={isDeletingTicker === key}
                                  >
                                    {isDeletingTicker === key
                                      ? <Loader2 className="h-4 w-4 animate-spin" />
                                      : <Trash2 className="h-4 w-4" />}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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
