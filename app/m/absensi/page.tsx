"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAbsensiSaya } from "@/lib/actions/absensi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const statusStyle: Record<string, string> = {
  HADIR: "bg-emerald-100 text-emerald-700",
  TERLAMBAT: "bg-amber-100 text-amber-700",
  IZIN: "bg-blue-100 text-blue-700",
  SAKIT: "bg-sky-100 text-sky-700",
  CUTI: "bg-purple-100 text-purple-700",
  ALPA: "bg-red-100 text-red-700",
  ALPHA: "bg-red-100 text-red-700",
}

export default function MobileAbsensi() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [bulan] = useState(now.getMonth() + 1)
  const [tahun] = useState(now.getFullYear())

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") loadData()
  }, [status])

  const loadData = async () => {
    try {
      const data = await getAbsensiSaya(bulan, tahun)
      setRecords(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <h1 className="text-lg font-bold">Riwayat Absensi</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {format(new Date(tahun, bulan - 1, 1), "MMMM yyyy", { locale: idLocale })}
        </span>
      </div>

      {/* Quick action selfie */}
      <div className="px-4 pt-4">
        <Link href="/m/selfie" className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-blue-600 px-5 py-4 text-white shadow-md">
          <div>
            <p className="font-semibold">Belum absen hari ini?</p>
            <p className="text-sm text-blue-100">Tap untuk selfie check-in</p>
          </div>
          <div className="text-3xl">📸</div>
        </Link>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-4xl mb-3">📋</p>
            <p>Belum ada data absensi bulan ini</p>
          </div>
        ) : (
          records.map(r => {
            const tgl = new Date(r.tanggal)
            const st = r.status as string
            return (
              <div key={r.id} className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4 shadow-sm">
                {/* Tanggal */}
                <div className="flex flex-col items-center w-12 shrink-0">
                  <span className="text-xs text-muted-foreground">{format(tgl, "EEE", { locale: idLocale })}</span>
                  <span className="text-xl font-bold leading-none">{format(tgl, "dd")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[st] || "bg-gray-100 text-gray-700"}`}>
                      {st}
                    </span>
                    {r.metode && <span className="text-[10px] text-muted-foreground">{r.metode}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.jamMasuk ? `Masuk ${new Date(r.jamMasuk).toTimeString().slice(0, 5)}` : "-"}
                    {r.jamKeluar ? ` · Pulang ${new Date(r.jamKeluar).toTimeString().slice(0, 5)}` : ""}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
