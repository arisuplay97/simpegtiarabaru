"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Wallet,
  FileText,
  Calendar,
  CheckCheck,
  Trash2,
  Settings,
} from "lucide-react"

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error"
  category: "approval" | "payroll" | "attendance" | "general" | "deadline"
  title: string
  message: string
  time: string
  read: boolean
  actionUrl?: string
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    category: "approval",
    title: "Pengajuan Cuti Menunggu Approval",
    message: "Ahmad Rizki Pratama mengajukan cuti tahunan 5 hari (18-22 Mar 2026). Segera approve/reject.",
    time: "5 menit lalu",
    read: false,
    actionUrl: "/approval",
  },
  {
    id: "2",
    type: "success",
    category: "payroll",
    title: "Payroll Maret 2026 Berhasil Diproses",
    message: "Gaji untuk 1,247 pegawai telah berhasil diproses dan siap ditransfer.",
    time: "1 jam lalu",
    read: false,
    actionUrl: "/payroll",
  },
  {
    id: "3",
    type: "error",
    category: "deadline",
    title: "SLA Approval Terlewat",
    message: "Pengajuan kenaikan pangkat Dewi Lestari telah melewati batas SLA. Segera tindak lanjuti.",
    time: "2 jam lalu",
    read: false,
    actionUrl: "/approval",
  },
  {
    id: "4",
    type: "info",
    category: "attendance",
    title: "Laporan Absensi Harian",
    message: "42 pegawai tidak hadir hari ini: 35 cuti, 5 sakit, 2 izin.",
    time: "3 jam lalu",
    read: true,
    actionUrl: "/absensi",
  },
  {
    id: "5",
    type: "warning",
    category: "approval",
    title: "5 Pengajuan Lembur Pending",
    message: "Terdapat 5 pengajuan lembur yang memerlukan persetujuan Anda.",
    time: "4 jam lalu",
    read: true,
    actionUrl: "/approval",
  },
  {
    id: "6",
    type: "info",
    category: "general",
    title: "Update Sistem SIMPEG",
    message: "Sistem akan melakukan maintenance pada Minggu, 22 Mar 2026 pukul 00:00-04:00 WIB.",
    time: "6 jam lalu",
    read: true,
  },
  {
    id: "7",
    type: "success",
    category: "approval",
    title: "Mutasi Disetujui",
    message: "Pengajuan mutasi Budi Santoso ke Cabang Utara telah disetujui oleh Direktur.",
    time: "1 hari lalu",
    read: true,
    actionUrl: "/pegawai/3",
  },
  {
    id: "8",
    type: "warning",
    category: "deadline",
    title: "Deadline Penilaian SKP",
    message: "Penilaian SKP periode Q1 2026 harus diselesaikan sebelum 31 Maret 2026.",
    time: "2 hari lalu",
    read: true,
    actionUrl: "/kpi",
  },
]

const typeConfig = {
  info: { icon: Info, className: "bg-blue-100 text-blue-700" },
  success: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  warning: { icon: AlertTriangle, className: "bg-amber-100 text-amber-700" },
  error: { icon: XCircle, className: "bg-red-100 text-red-700" },
}

const categoryConfig = {
  approval: { label: "Approval", icon: Clock },
  payroll: { label: "Payroll", icon: Wallet },
  attendance: { label: "Kehadiran", icon: User },
  general: { label: "Umum", icon: Bell },
  deadline: { label: "Deadline", icon: Calendar },
}

export default function NotifikasiPage() {
  const [selectedTab, setSelectedTab] = useState("all")
  const [notificationList, setNotificationList] = useState(notifications)

  const unreadCount = notificationList.filter((n) => !n.read).length

  const filteredNotifications = notificationList.filter((n) => {
    if (selectedTab === "all") return true
    if (selectedTab === "unread") return !n.read
    return n.category === selectedTab
  })

  const markAsRead = (id: string) => {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotificationList((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
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
              <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Tandai Semua Dibaca
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{notificationList.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Info className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Belum Dibaca</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {notificationList.filter((n) => n.category === "approval").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Approval</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Wallet className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {notificationList.filter((n) => n.category === "payroll").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Payroll</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-700" />
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {notificationList.filter((n) => n.category === "deadline").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                </div>
              </CardContent>
            </Card>
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
              <TabsTrigger value="approval">Approval</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="deadline">Deadline</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-0">
              <Card className="card-premium">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <div className="divide-y divide-border">
                      {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
                          <p className="text-lg font-medium text-muted-foreground">Tidak ada notifikasi</p>
                          <p className="text-sm text-muted-foreground">
                            Anda tidak memiliki notifikasi dalam kategori ini
                          </p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification) => {
                          const TypeIcon = typeConfig[notification.type].icon
                          const CategoryIcon = categoryConfig[notification.category].icon
                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                "flex items-start gap-4 p-4 transition-colors hover:bg-muted/30",
                                !notification.read && "bg-primary/5"
                              )}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                  typeConfig[notification.type].className
                                )}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4
                                        className={cn(
                                          "font-medium",
                                          !notification.read && "font-semibold"
                                        )}
                                      >
                                        {notification.title}
                                      </h4>
                                      {!notification.read && (
                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {notification.message}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <CategoryIcon className="h-3 w-3" />
                                    {categoryConfig[notification.category].label}
                                  </span>
                                  <span>{notification.time}</span>
                                  {notification.actionUrl && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs text-primary"
                                      asChild
                                    >
                                      <a href={notification.actionUrl}>Lihat Detail</a>
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
