"use client"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { UserCircle } from "lucide-react"

export default function ProfilBasePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Profil Pegawai"]} />
        <main className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Pilih Profil Pegawai</h1>
            <p className="text-muted-foreground">
              Silakan akses profil staf Anda dengan memillih nama mereka di menu <strong>Data Pegawai</strong>, atau gunakan pencarian untuk menemukan pegawai spesifik.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
