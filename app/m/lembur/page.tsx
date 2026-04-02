"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, CalendarDays, CheckCircle, Clock, XCircle, Timer } from "lucide-react"
import { hitungTarifLembur, ajukanLembur, getLemburList } from "@/lib/actions/shift-lembur-fixed"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"

const statusStyle: Record<string, { label: string; class: string; icon: any }> = {
  PENDING:  { label: "Menunggu",  class: "bg-amber-100 text-amber-700",  icon: Clock },
  APPROVED: { label: "Disetujui", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REJECTED: { label: "Ditolak",   class: "bg-red-100 text-red-700",      icon: XCircle },
}

export default function MobileLembur() {
  const { status, data: session } = useSession()
  const router = useRouter()
  
  const [pegawaiId, setPegawaiId] = useState<string | null>(null)
  const [lemburList, setLemburList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    jenis: "HARI_KERJA" as "HARI_KERJA" | "HARI_LIBUR" | "HARI_BESAR",
    tanggal: "",
    jamMulai: "",
    jamSelesai: "",
    alasan: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") fetchProfileAndData()
  }, [status])

  const fetchProfileAndData = async () => {
    try {
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        if (p?.id) {
          setPegawaiId(p.id)
          const lemburRes = await getLemburList({ pegawaiId: p.id })
          setLemburList(lemburRes)
        }
      }
    } catch {}
    setLoading(false)
  }

  // Helper to calculate durasiJam
  const hitungDurasi = () => {
    if (!form.jamMulai || !form.jamSelesai) return 0
    const [hM, mM] = form.jamMulai.split(":").map(Number)
    const [hS, mS] = form.jamSelesai.split(":").map(Number)
    let durasi = (hS + mS / 60) - (hM + mM / 60)
    if (durasi < 0) durasi += 24 // Cross midnight
    return Number(durasi.toFixed(1))
  }

  const handleSubmit = async () => {
    if (!pegawaiId) {
      toast.error("Profil pegawai tidak ditemukan")
      return
    }
    if (!form.tanggal || !form.jamMulai || !form.jamSelesai || !form.alasan) {
      toast.error("Semua field wajib diisi")
      return
    }
    
    const durasiJam = hitungDurasi()
    if (durasiJam <= 0) {
      toast.error("Waktu mulai dan selesai tidak valid")
      return
    }

    setSubmitting(true)
    try {
      const res = await ajukanLembur({
        pegawaiId,
        tanggal: form.tanggal,
        jamMulai: form.jamMulai,
        jamSelesai: form.jamSelesai,
        durasiJam,
        jenis: form.jenis,
        alasan: form.alasan,
      })

      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan lembur berhasil dikirim!")
      setForm({ jenis: "HARI_KERJA", tanggal: "", jamMulai: "", jamSelesai: "", alasan: "" })
      setShowForm(false)
      
      // Reload Data
      setLoading(true)
      const lemburRes = await getLemburList({ pegawaiId })
      setLemburList(lemburRes)
      setLoading(false)
    } catch (e: any) {
      toast.error(e.message)
      setLoading(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 pb-4 flex items-center" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <h1 className="text-lg font-bold">Lembur Kerja</h1>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-transform shadow-sm shadow-primary/30"
        >
          <Plus className="h-4 w-4" /> Ajukan
        </button>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : lemburList.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
            <Timer className="h-12 w-12 text-slate-200 mb-3" />
            <p className="font-semibold text-slate-500">Belum ada riwayat lembur</p>
          </div>
        ) : (
          lemburList.map(item => {
            const s = statusStyle[item.status] || statusStyle.PENDING
            const Icon = s.icon
            return (
              <div key={item.id} className="rounded-2xl bg-white border border-border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-3 relative overflow-hidden">
                {/* Decoration edge */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10" />
                
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> 
                      {item.tanggal}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        {item.jamMulai} - {item.jamSelesai}
                      </span>
                      <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {item.durasiJam} Jam
                      </span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 ${s.class} border border-current shadow-sm`}>
                    <Icon className="h-3.5 w-3.5" />{s.label}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{item.jenis.replace("_", " ")}</p>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{item.alasan}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Sheet Form */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full rounded-t-3xl bg-white p-6 pb-12 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom-full duration-300 border-t border-slate-100">
            {/* Pill Header */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200" />
            
            <div className="mb-6 mt-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800">Ajukan Lembur</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Form pengajuan jam tambahan</p>
              </div>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Jenis Jam</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    value={form.jenis}
                    onChange={e => setForm(p => ({ ...p, jenis: e.target.value as any }))}
                  >
                    <option value="HARI_KERJA">Hari Kerja Biasa</option>
                    <option value="HARI_LIBUR">Hari Libur / Akhir Pekan</option>
                    <option value="HARI_BESAR">Hari Libur Nasional / Cuti Bersama</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Tanggal Pelaksanaan</label>
                <input type="date" className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  value={form.tanggal} onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Mulai Jam</label>
                  <input type="time" className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    value={form.jamMulai} onChange={e => setForm(p => ({ ...p, jamMulai: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Selesai Jam</label>
                  <input type="time" className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    value={form.jamSelesai} onChange={e => setForm(p => ({ ...p, jamSelesai: e.target.value }))} />
                </div>
              </div>

              {/* Live Duration Preview */}
              {form.jamMulai && form.jamSelesai && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Timer className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-800">
                      Total Durasi: <span className="text-amber-600 bg-white px-1.5 rounded ms-1">{hitungDurasi()} Jam</span>
                    </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Keterangan / Alasan</label>
                <textarea rows={3} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 resize-none focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Misal: Menyelesaikan laporan keuangan akhir bulan..."
                  value={form.alasan} onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-4 font-bold text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:shadow-none disabled:scale-100"
                >
                  {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                  {submitting ? "Memproses Form..." : "Ajukan Lembur Sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
