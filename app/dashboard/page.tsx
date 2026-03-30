import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardStats, getPegawaiDashboardStats } from "@/lib/actions/dashboard"
import { getLeaderboard } from "@/lib/actions/indeks"
import DashboardClient from "./client"

// Use edge runtime for faster TTFB if compatible, or default Node runtime.
// If using Prisma, edge runtime might not be fully supported unless using Prisma Accelerate. We stick to default Node.

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const isPegawai = session.user?.role === "PEGAWAI"
  
  // Parallel fetch: data is fetched BEFORE sending to client!
  let stats = null
  let leaderboard: any[] = []

  if (isPegawai) {
    stats = await getPegawaiDashboardStats((session.user as any).id)
  } else {
    const [dStats, lbData] = await Promise.all([
      getDashboardStats(),
      getLeaderboard()
    ])
    stats = dStats
    leaderboard = lbData
  }

  return (
    <DashboardClient 
      session={session} 
      initialStats={stats} 
      initialLeaderboard={leaderboard} 
      isPegawai={isPegawai} 
    />
  )
}
