import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-[#f4f6f9] dark:bg-[#09090b]">
      {/* Sidebar Placeholder */}
      <div className="hidden md:flex w-72 shrink-0 border-r border-border bg-card h-screen sticky top-0" />
      
      <div className="flex-1 flex flex-col">
        {/* TopBar Placeholder */}
        <div className="h-14 md:h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <Skeleton className="h-4 w-32" /> {/* Breadcrumb */}
          <div className="flex items-center gap-4">
             <Skeleton className="h-8 w-8 rounded-full" />
             <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 xl:p-8 space-y-5 max-w-[1400px] mx-auto w-full">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Leaderboard Skeleton */}
          <Card className="bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 rounded-2xl">
            <div className="p-4 space-y-4">
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 h-80">
                <Card className="bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 rounded-2xl p-5">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-full w-full" />
                </Card>
                <Card className="bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 rounded-2xl p-5">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-full w-full" />
                </Card>
            </div>
            <Card className="bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 rounded-2xl p-5">
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-2 w-full" />
                                <Skeleton className="h-2 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
