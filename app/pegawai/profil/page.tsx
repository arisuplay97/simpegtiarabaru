"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Loader2, UserCircle, Users, Search, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilBasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [pegawaiList, setPegawaiList] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user?.id) {
      setError("Anda belum login. Silakan login terlebih dahulu.")
      setLoading(false)
      return
    }

    const role = (session.user as any).role
    if (role === "SUPERADMIN" || role === "HRD") {
      setIsAdmin(true)
      fetchAdminData()
    } else {
      fetchMyProfil()
    }
  }, [session, status, router])

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/pegawai")
      if (res.ok) {
        const data = await res.json()
        setPegawaiList(data)
      }
      setLoading(false)
    } catch {
      setError("Gagal memuat daftar pegawai.")
      setLoading(false)
    }
  }

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
      setError("Profil pegawai Anda belum terdaftar. Hubungi HRD.")
      setLoading(false)
    } catch {
      setError("Gagal memuat profil.")
      setLoading(false)
    }
  }

  const filtered = pegawaiList.filter(p => 
    p.nama.toLowerCase().includes(search.toLowerCase()) || 
    p.nik.includes(search)
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Profil Pegawai"]} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Menghubungkan ke sistem...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Akses Profil</h1>
                  <p className="text-muted-foreground max-w-sm">{error}</p>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Katalog Profil Pegawai</h1>
                    <p className="text-sm text-muted-foreground">Pilih pegawai untuk melihat detail profil lengkapnya</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari nama atau NIK pegawai..." 
                    className="pl-10 h-12 shadow-sm border-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <Card 
                        key={p.id} 
                        className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group overflow-hidden"
                        onClick={() => {
                           const slug = `${p.nama.toLowerCase().replace(/ /g, "-")}-${p.id}`
                           router.push(`/pegawai/${slug}`)
                        }}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary/5 group-hover:border-primary/20 transition-colors">
                            <AvatarImage src={p.fotoUrl} alt={p.nama} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                              {p.nama[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{p.nama}</p>
                            <p className="text-xs text-muted-foreground">{p.nik} • {p.jabatan}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl bg-muted/30">
                       <p className="text-muted-foreground">Tidak menemukan pegawai yang sesuai</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

          </div>
        </main>
      </div>
    </div>
  )
}
