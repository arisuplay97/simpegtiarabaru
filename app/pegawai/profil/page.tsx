"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Loader2, UserCircle } from "lucide-react"

export default function ProfilBasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user?.id) {
      setError("Anda belum login. Silakan login terlebih dahulu.")
      setLoading(false)
      return
    }

    // Cari pegawai berdasarkan userId
    const fetchProfil = async () => {
      try {
        const res = await fetch("/api/pegawai/me")
        if (res.ok) {
          const data = await res.json()
          if (data?.id) {
            const slug = `${(data.nama || "pegawai").toLowerCase().replace(/ /g, "-")}-${data.id}`
            router.replace(`/pegawai/${slug}`)
            return
          }
        }
        setError("Profil pegawai Anda belum terdaftar. Hubungi HRD untuk mendaftarkan data Anda.")
        setLoading(false)
      } catch {
        setError("Gagal memuat profil. Coba refresh halaman.")
        setLoading(false)
      }
    }
    fetchProfil()
  }, [session, status, router])

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Profil Pegawai"]} />
        <main className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {loading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <UserCircle className="w-8 h-8 text-primary" />
              )}
            </div>
            {loading ? (
              <>
                <h1 className="text-2xl font-bold">Memuat Profil...</h1>
                <p className="text-muted-foreground">Sedang mencari data profil Anda</p>
              </>
            ) : error ? (
              <>
                <h1 className="text-2xl font-bold">Profil Pegawai</h1>
                <p className="text-muted-foreground">{error}</p>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
