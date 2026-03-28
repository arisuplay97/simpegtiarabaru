"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Star, Save, CheckCircle2, Loader2, ArrowLeft,
  User, Calendar, Shield, Clock, AlertTriangle,
  ClipboardList, Lightbulb, MessageSquare, ChevronDown, Send
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SidebarNav, SidebarProvider } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { toast } from "sonner"
import { getPenilaianDetail, savePenilaian, finalisasiPenilaian } from "@/lib/actions/penilaian"

// ─── Komponen Penilaian ─────────────────────────────────────────────
const KOMPONEN = [
  {
    key: "disiplinKerja" as const,
    label: "Disiplin Kerja",
    desc: "Ketaatan terhadap peraturan, jam kerja, dan tata tertib",
    icon: "🕐",
    levels: ["Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"],
  },
  {
    key: "tanggungjawab" as const,
    label: "Tanggung Jawab",
    desc: "Kesungguhan dalam menyelesaikan tugas yang diberikan",
    icon: "✅",
    levels: ["Sangat Rendah", "Rendah", "Cukup", "Tinggi", "Sangat Tinggi"],
  },
  {
    key: "kualitasKerja" as const,
    label: "Kualitas Kerja",
    desc: "Akurasi, ketelitian, dan mutu dari hasil pekerjaan",
    icon: "⭐",
    levels: ["Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"],
  },
  {
    key: "sikapKerja" as const,
    label: "Sikap Kerja",
    desc: "Kerjasama, attitude, dan hubungan dengan rekan kerja",
    icon: "🤝",
    levels: ["Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"],
  },
  {
    key: "inisiatif" as const,
    label: "Inisiatif",
    desc: "Kemampuan untuk bertindak proaktif dan memberikan ide",
    icon: "💡",
    levels: ["Tidak Ada", "Sangat Kurang", "Cukup", "Baik", "Sangat Baik"],
  },
  {
    key: "kepatuhan" as const,
    label: "Kepatuhan",
    desc: "Kepatuhan terhadap instruksi, SOP, dan arahan pimpinan",
    icon: "📋",
    levels: ["Tidak Patuh", "Kurang Patuh", "Cukup", "Patuh", "Sangat Patuh"],
  },
]

const CATATAN_DISIPLIN_LIST = [
  "Selalu hadir tepat waktu",
  "Melapor saat tidak masuk",
  "Tidak pernah mangkir tanpa keterangan",
  "Berpakaian sesuai ketentuan",
  "Tidak menggunakan HP berlebihan saat jam kerja",
  "Menjaga kebersihan area kerja",
  "Menyelesaikan pekerjaan sebelum batas waktu",
  "Bersikap profesional dalam melayani",
]

const REKOMENDASI_OPTIONS = [
  { value: "Pertahankan", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "Tingkatkan", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "Perlu Pembinaan", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "Evaluasi Khusus", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
]

// ─── Star Rating Component ──────────────────────────────────────────
function StarRating({
  value, onChange, levels, disabled
}: { value: number; onChange: (v: number) => void; levels: string[]; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  const color = display >= 5 ? "text-emerald-500" : display >= 4 ? "text-blue-500" :
    display >= 3 ? "text-amber-500" : display >= 2 ? "text-orange-500" : "text-red-500"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(i)}
            onMouseEnter={() => !disabled && setHovered(i)}
            onMouseLeave={() => !disabled && setHovered(0)}
            className={cn(
              "transition-all duration-150",
              disabled ? "cursor-not-allowed opacity-60" : "hover:scale-110 cursor-pointer"
            )}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                i <= display ? `fill-current ${color}` : "text-neutral-200 dark:text-neutral-700"
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className={cn("ml-2 text-sm font-bold", color)}>
            {levels[value - 1]}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <div key={i} className={cn(
            "h-1 flex-1 rounded-full transition-all",
            i < (display) ? color.replace("text-", "bg-") : "bg-neutral-100 dark:bg-neutral-800"
          )} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Form Content ──────────────────────────────────────────────
function FormPenilaianContent({ params }: { params: { pegawaiId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bulan = Number(searchParams.get("bulan")) || (new Date().getMonth() + 1)
  const tahun = Number(searchParams.get("tahun")) || new Date().getFullYear()

  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  // Form state
  const [scores, setScores] = useState<Record<string, number>>({
    disiplinKerja: 3, tanggungjawab: 3, kualitasKerja: 3,
    sikapKerja: 3, inisiatif: 3, kepatuhan: 3
  })
  const [catatanDisiplin, setCatatanDisiplin] = useState<string[]>([])
  const [kelebihan, setKelebihan] = useState("")
  const [halPerluDiperbaiki, setHalPerluDiperbaiki] = useState("")
  const [catatanAtasan, setCatatanAtasan] = useState("")
  const [rekomendasi, setRekomendasi] = useState("")

  const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await getPenilaianDetail(params.pegawaiId, bulan, tahun)
      if ((res as any).success) {
        setDetail(res)
        const p = (res as any).penilaian
        if (p) {
          setScores({
            disiplinKerja: p.disiplinKerja,
            tanggungjawab: p.tanggungjawab,
            kualitasKerja: p.kualitasKerja,
            sikapKerja: p.sikapKerja,
            inisiatif: p.inisiatif,
            kepatuhan: p.kepatuhan,
          })
          setCatatanDisiplin(Array.isArray(p.catatanDisiplin) ? p.catatanDisiplin : [])
          setKelebihan(p.kelebihan ?? "")
          setHalPerluDiperbaiki(p.halPerluDiperbaiki ?? "")
          setCatatanAtasan(p.catatanAtasan ?? "")
          setRekomendasi(p.rekomendasi ?? "")
        }
      } else {
        toast.error((res as any).error || "Gagal memuat data")
      }
      setLoading(false)
    }
    load()
  }, [params.pegawaiId, bulan, tahun])

  const isFinal = detail?.penilaian?.status === 'FINAL'

  // Live skor preview
  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6
  const skorAtasanPreview = Math.round(((avgScore - 1) / 4) * 100 * 10) / 10
  const skorSistem = detail?.indeks?.totalSkor ?? null
  const blendedPreview = skorSistem !== null
    ? Math.round((Number(skorSistem) * 0.6 + skorAtasanPreview * 0.4) * 10) / 10
    : null

  const handleSave = async (asFinal = false) => {
    const setter = asFinal ? setFinalizing : setSaving
    setter(true)
    try {
      const payload = {
        pegawaiId: params.pegawaiId,
        bulan, tahun,
        indeksPegawaiId: detail?.indeks?.id ?? null,
        disiplinKerja: scores.disiplinKerja,
        tanggungjawab: scores.tanggungjawab,
        kualitasKerja: scores.kualitasKerja,
        sikapKerja: scores.sikapKerja,
        inisiatif: scores.inisiatif,
        kepatuhan: scores.kepatuhan,
        catatanDisiplin,
        kelebihan: kelebihan || undefined,
        halPerluDiperbaiki: halPerluDiperbaiki || undefined,
        catatanAtasan: catatanAtasan || undefined,
        rekomendasi: rekomendasi || undefined,
      }
      const saveRes = await savePenilaian(payload)
      if (!(saveRes as any).success) {
        toast.error((saveRes as any).error)
        return
      }

      if (asFinal) {
        const penilaianId = (saveRes as any).data.id
        const finalRes = await finalisasiPenilaian(penilaianId)
        if ((finalRes as any).success) {
          toast.success("Penilaian berhasil difinalkan!")
          router.push("/penilaian")
        } else {
          toast.error((finalRes as any).error)
        }
      } else {
        toast.success("Draft penilaian tersimpan")
        // Refresh detail
        const refreshed = await getPenilaianDetail(params.pegawaiId, bulan, tahun)
        if ((refreshed as any).success) setDetail(refreshed)
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setter(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-neutral-400">Memuat data pegawai...</p>
      </div>
    </div>
  )

  const pegawai = detail?.pegawai
  const indeks = detail?.indeks

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: "var(--sidebar-width, 16rem)" }}>
        <TopBar breadcrumb={["Penilaian Pegawai", "Form Penilaian"]} />

        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
          {/* Back + Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => router.back()}>
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali
            </Button>
            {isFinal && (
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sudah Final – Tidak bisa diedit
              </Badge>
            )}
          </div>

          {/* Employee Card */}
          {pegawai && (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-neutral-100 dark:ring-neutral-800">
                    <AvatarImage src={pegawai.fotoUrl} />
                    <AvatarFallback className="text-base font-black bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {pegawai.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{pegawai.nama}</h2>
                    <p className="text-sm text-neutral-500">{pegawai.jabatan} · {pegawai.bidang?.nama}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Periode: {BULAN_NAMES[bulan - 1]} {tahun}
                    </p>
                  </div>
                  {/* SP Warning */}
                  {pegawai.suratPeringatan?.length > 0 && (
                    <div className="flex flex-col items-center gap-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <p className="text-[10px] font-semibold text-red-600 text-center">
                        SP Aktif: {pegawai.suratPeringatan[0].jenis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ringkasan Sistem */}
                {indeks && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    {[
                      { label: "Skor Sistem", value: indeks.totalSkor, suffix: "/100", color: indeks.totalSkor >= 80 ? "text-emerald-600" : indeks.totalSkor >= 70 ? "text-amber-600" : "text-red-500" },
                      { label: "Hari Hadir", value: `${indeks.hadirCount}/${indeks.hariKerja}`, suffix: "hari", color: "text-blue-600" },
                      { label: "Terlambat", value: indeks.terlambatCount, suffix: "kali", color: indeks.terlambatCount > 5 ? "text-red-500" : "text-neutral-600" },
                      { label: "Alpha", value: indeks.alphaCount, suffix: "hari", color: indeks.alphaCount > 3 ? "text-red-500" : "text-neutral-600" },
                    ].map(item => (
                      <div key={item.label} className="text-center bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className={cn("text-xl font-black", item.color)}>{item.value}</p>
                        <p className="text-[10px] text-neutral-400">{item.suffix}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Score Preview */}
          <Card className="border border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Preview Skor</p>
                  <p className="text-[11px] text-blue-500/70">Formula: (Sistem × 60%) + (Atasan × 40%)</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-neutral-400">Skor Atasan</p>
                    <p className={cn("text-2xl font-black",
                      skorAtasanPreview >= 80 ? "text-emerald-600" :
                      skorAtasanPreview >= 60 ? "text-amber-600" : "text-red-500"
                    )}>{skorAtasanPreview}</p>
                  </div>
                  {blendedPreview !== null && (
                    <>
                      <div className="text-neutral-300 dark:text-neutral-600 font-bold">→</div>
                      <div className="text-center bg-white dark:bg-neutral-900 rounded-xl px-4 py-2 shadow-sm">
                        <p className="text-[10px] text-neutral-400">Skor Akhir</p>
                        <p className={cn("text-2xl font-black",
                          blendedPreview >= 90 ? "text-emerald-600" :
                          blendedPreview >= 80 ? "text-blue-600" :
                          blendedPreview >= 70 ? "text-amber-600" : "text-red-500"
                        )}>{blendedPreview}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Komponen Penilaian */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader className="pb-3 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Komponen Penilaian
              </CardTitle>
              <CardDescription className="text-xs">Berikan nilai 1–5 untuk setiap komponen</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {KOMPONEN.map(k => (
                <div key={k.key}>
                  <div className="flex items-start gap-2 mb-2.5">
                    <span className="text-lg">{k.icon}</span>
                    <div>
                      <Label className="text-sm font-semibold text-neutral-800 dark:text-white">{k.label}</Label>
                      <p className="text-[11px] text-neutral-400">{k.desc}</p>
                    </div>
                  </div>
                  <StarRating
                    value={scores[k.key]}
                    onChange={v => setScores(prev => ({ ...prev, [k.key]: v }))}
                    levels={k.levels}
                    disabled={isFinal}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Catatan Disiplin Lapangan */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader className="pb-3 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                Catatan Disiplin Lapangan
              </CardTitle>
              <CardDescription className="text-xs">Centang hal yang sesuai dengan perilaku pegawai selama periode ini</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATATAN_DISIPLIN_LIST.map(item => (
                  <label
                    key={item}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all select-none",
                      catatanDisiplin.includes(item)
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      isFinal && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-500"
                      checked={catatanDisiplin.includes(item)}
                      disabled={isFinal}
                      onChange={e => {
                        setCatatanDisiplin(prev =>
                          e.target.checked ? [...prev, item] : prev.filter(c => c !== item)
                        )
                      }}
                    />
                    <span className="text-[12px] text-neutral-700 dark:text-neutral-300">{item}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Narasi */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader className="pb-3 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                Catatan & Rekomendasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5 block">
                  <Lightbulb className="inline h-3.5 w-3.5 mr-1 text-amber-500" />
                  Kelebihan Pegawai
                </Label>
                <Textarea
                  placeholder="Tuliskan kelebihan/prestasi yang menonjol selama periode ini..."
                  className="text-sm resize-none min-h-[80px]"
                  value={kelebihan}
                  onChange={e => setKelebihan(e.target.value)}
                  disabled={isFinal}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5 block">
                  <AlertTriangle className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                  Hal yang Perlu Diperbaiki
                </Label>
                <Textarea
                  placeholder="Aspek-aspek apa yang masih perlu ditingkatkan..."
                  className="text-sm resize-none min-h-[80px]"
                  value={halPerluDiperbaiki}
                  onChange={e => setHalPerluDiperbaiki(e.target.value)}
                  disabled={isFinal}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5 block">
                  <MessageSquare className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
                  Catatan Atasan (Opsional)
                </Label>
                <Textarea
                  placeholder="Catatan tambahan dari atasan langsung..."
                  className="text-sm resize-none min-h-[80px]"
                  value={catatanAtasan}
                  onChange={e => setCatatanAtasan(e.target.value)}
                  disabled={isFinal}
                />
              </div>

              {/* Rekomendasi */}
              <div>
                <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-2 block">
                  Rekomendasi Tindak Lanjut
                </Label>
                <div className="flex flex-wrap gap-2">
                  {REKOMENDASI_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isFinal}
                      onClick={() => setRekomendasi(prev => prev === opt.value ? "" : opt.value)}
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                        rekomendasi === opt.value ? opt.color : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700",
                        isFinal && "cursor-not-allowed opacity-70"
                      )}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isFinal && (
            <div className="flex flex-col sm:flex-row gap-3 pb-6">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleSave(false)}
                disabled={saving || finalizing}
                id="btn-simpan-draft"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Draft
              </Button>
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleSave(true)}
                disabled={saving || finalizing || !rekomendasi}
                id="btn-finalisasi"
              >
                {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Finalkan Penilaian
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function FormPenilaianPage({ params }: { params: Promise<{ pegawaiId: string }> }) {
  const resolvedParams = use(params)
  return (
    <SidebarProvider>
      <FormPenilaianContent params={resolvedParams} />
    </SidebarProvider>
  )
}
