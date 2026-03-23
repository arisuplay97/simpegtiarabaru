"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Bell,
  CheckCircle2,
  Info,
  CheckCheck,
  Settings,
  Link as LinkIcon
} from "lucide-react"
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifikasi"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"

export default function NotifikasiPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [selectedTab, setSelectedTab] = useState("all")
  const [notificationList, setNotificationList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await getNotifications(user.id)
      setNotificationList(data)
    } catch (e) {
      toast.error("Gagal memuat notifikasi")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const unreadCount = notificationList.filter((n) => !n.isRead).length

  const filteredNotifications = notificationList.filter((n) => {
    if (selectedTab === "all") return true
    if (selectedTab === "unread") return !n.isRead
    return true
  })

  const handleMarkAsRead = async (id: string, currentReadStatus: boolean) => {
    if (currentReadStatus) return // Already read
    
    // Optimistic UI update
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    
    if (user?.id) {
       await markAsRead(id, user.id)
       // Let the root polling handle the bell icon later, no need to loadData strictly for now
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return
    
    // Optimistic
    setNotificationList((prev) => prev.map((n) => ({ ...n, isRead: true })))
    
    try {
      await markAllAsRead(user.id)
      toast.success("Semua notifikasi ditandai dibaca")
    } catch (e) {
      toast.error("Gagal memperbarui notifikasi")
      loadData() // Revert
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Notifikasi"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifikasi</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `Anda memiliki ${unreadCount} notifikasi belum dibaca`
                  : "Semua notifikasi sudah dibaca"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || isLoading}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Tandai Semua Dibaca
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs & Content */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                Belum Dibaca
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-0">
              <Card className="card-premium">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="divide-y divide-border">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat notifikasi...</p>
                        </div>
                      ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
                          <p className="text-lg font-medium text-muted-foreground">Tidak ada notifikasi</p>
                          <p className="text-sm text-muted-foreground">
                            Anda tidak memiliki notifikasi dalam kategori ini
                          </p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification) => {
                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                "flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 cursor-pointer",
                                !notification.isRead && "bg-primary/5"
                              )}
                              onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                            >
                              <div
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                  "bg-primary/10 text-primary" // Generic icon style since generic Notifikasi table
                                )}
                              >
                                <Info className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4
                                        className={cn(
                                          "font-medium",
                                          !notification.isRead && "font-semibold"
                                        )}
                                      >
                                        {notification.title}
                                      </h4>
                                      {!notification.isRead && (
                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {notification.message}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: idLocale })}
                                  </span>
                                  {notification.link && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs text-primary gap-1"
                                      asChild
                                    >
                                      <Link href={notification.link}>
                                        <LinkIcon className="h-3 w-3" />
                                        Lihat Detail
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
