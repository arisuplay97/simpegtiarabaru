"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Loader2, CalendarDays, CheckCircle2, Clock, XCircle, ArrowLeft, X } from "lucide-react"
import { getCutiList, createCuti } from "@/lib/actions/cuti"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusStyle: Record<string, { label: string; class: string; icon: any }> = {
  PENDING:  { label: "Menunggu",  class: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",  icon: Clock },
  APPROVED: { label: "Disetujui", class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak",   class: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",      icon: XCircle },
}

export default function MobileCuti() {
  const { status } = useSession()
  const router = useRouter()
  const [cutiList, setCutiList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    jenisCuti: "Cuti Tahunan",
    tanggalMulai: "",
    tanggalSelesai: "",
    alasan: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") fetchCuti()
  }, [status])

  const fetchCuti = async () => {
    try {
      const res = await getCutiList()
      if (res.data) setCutiList(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.tanggalMulai || !form.tanggalSelesai || !form.alasan) {
      toast.error("Semua field wajib diisi")
      return
    }
    setSubmitting(true)
    try {
      const res = await createCuti(form)
      if ((res as any).error) throw new Error((res as any).error)
      toast.success("Pengajuan cuti berhasil dikirim!")
      setForm({ jenisCuti: "Cuti Tahunan", tanggalMulai: "", tanggalSelesai: "", alasan: "" })
      setShowForm(false)
      fetchCuti()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] pb-24 font-sans">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Cuti & Izin</h1>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-2xs active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Ajukan Cuti
        </button>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : cutiList.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <CalendarDays className="mx-auto h-10 w-10 mb-2.5 opacity-30 stroke-[1.5]" />
            <p className="text-sm font-medium">Belum ada pengajuan cuti</p>
          </div>
        ) : (
          cutiList.map(c => {
            const s = statusStyle[c.status] || statusStyle.PENDING
            const Icon = s.icon

            return (
              <div 
                key={c.id} 
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{c.jenisCuti?.replace("_", " ")}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                      {format(new Date(c.tanggalMulai), "d MMM", { locale: idLocale })} –{" "}
                      {format(new Date(c.tanggalSelesai), "d MMM yyyy", { locale: idLocale })}
                    </p>
                    {c.alasan && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 line-clamp-2">
                        {c.alasan}
                      </p>
                    )}
                  </div>
                  <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0", s.class)}>
                    <Icon className="h-3 w-3" />{s.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Sheet Form */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-6 max-h-[88vh] overflow-y-auto border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
            <div className="mb-5 flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ajukan Permohonan Cuti</h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jenis Cuti</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  value={form.jenisCuti}
                  onChange={e => setForm(p => ({ ...p, jenisCuti: e.target.value }))}
                >
                  {["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan", "Cuti Besar", "Izin Tidak Masuk"].map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Mulai</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={form.tanggalMulai} 
                    onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Selesai</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={form.tanggalSelesai} 
                    onChange={e => setForm(p => ({ ...p, tanggalSelesai: e.target.value }))} 
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Keterangan / Alasan</label>
                <textarea 
                  rows={3} 
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  placeholder="Tuliskan keterangan detail pengajuan..."
                  value={form.alasan} 
                  onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} 
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-xl bg-zinc-900 dark:bg-white py-3 font-semibold text-xs text-white dark:text-zinc-900 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
