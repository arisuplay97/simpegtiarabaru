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

    fetchMyProfil()
  }, [session, status, router])

  const fetchMyProfil = async () => {
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
      setError("Profil pegawai Anda belum terdaftar. Sistem tidak dapat menemukan data pegawai yang tertaut dengan akun Anda.")
      setLoading(false)
    } catch {
      setError("Gagal memuat profil.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Profil Saya"]} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Menghubungkan ke profil Anda...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Akses Profil</h1>
                  <p className="text-muted-foreground max-w-sm mt-2">{error}</p>
                </div>
              </div>
            ) : null}

          </div>
        </main>
      </div>
    </div>
  )
}
