"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, CalendarDays, CheckCircle, Clock, XCircle } from "lucide-react"
import { getCutiList, createCuti } from "@/lib/actions/cuti"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"

const statusStyle: Record<string, { label: string; class: string; icon: any }> = {
  PENDING:  { label: "Menunggu",  class: "bg-amber-100 text-amber-700",  icon: Clock },
  APPROVED: { label: "Disetujui", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REJECTED: { label: "Ditolak",   class: "bg-red-100 text-red-700",      icon: XCircle },
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
    const res = await getCutiList()
    if (res.data) setCutiList(res.data)
    setLoading(false)
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 pb-4 flex items-center" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <h1 className="text-lg font-bold">Cuti & Izin</h1>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Ajukan
        </button>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : cutiList.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-4xl mb-3">🏖️</p>
            <p>Belum ada pengajuan cuti</p>
          </div>
        ) : (
          cutiList.map(c => {
            const s = statusStyle[c.status] || statusStyle.PENDING
            const Icon = s.icon
            return (
              <div key={c.id} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{c.jenisCuti?.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(c.tanggalMulai), "d MMM", { locale: idLocale })} –{" "}
                      {format(new Date(c.tanggalSelesai), "d MMM yyyy", { locale: idLocale })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.alasan}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${s.class}`}>
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
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50">
          <div className="w-full rounded-t-3xl bg-card p-6 max-h-[85vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Ajukan Cuti</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jenis Cuti</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
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
                  <label className="mb-1.5 block text-sm font-medium">Mulai</label>
                  <input type="date" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
                    value={form.tanggalMulai} onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Selesai</label>
                  <input type="date" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
                    value={form.tanggalSelesai} onChange={e => setForm(p => ({ ...p, tanggalSelesai: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Alasan</label>
                <textarea rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
                  placeholder="Tuliskan alasan pengajuan cuti..."
                  value={form.alasan} onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-2xl bg-primary py-4 font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
