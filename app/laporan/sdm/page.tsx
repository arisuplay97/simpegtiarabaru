"use client"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function LaporanSdmPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Laporan", "Laporan SDM"]} />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <Construction className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Sedang Dikembangkan</h2>
              <p className="text-sm text-muted-foreground">Halaman ini akan segera tersedia.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
