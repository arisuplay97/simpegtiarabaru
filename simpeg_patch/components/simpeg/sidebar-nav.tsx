"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth, roleLabels } from "@/components/auth/auth-provider"
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Building2,
  Briefcase,
  ArrowRightLeft,
  Clock,
  Camera,
  CalendarDays,
  FileCheck,
  Navigation,
  Wallet,
  Receipt,
  ArrowUpCircle,
  Target,
  Star,
  FolderOpen,
  FileSignature,
  ShieldCheck,
  UserCog,
  Bell,
  CheckSquare,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react"

type NavItem = {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
  allowedRoles?: Array<"super_admin" | "hrd" | "direktur" | "pegawai">
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { title: "Dashboard Utama", href: "/", icon: LayoutDashboard },
      { title: "Dashboard Direksi", href: "/dashboard/direksi", icon: BarChart3, allowedRoles: ["super_admin", "direktur"] },
      { title: "Approval Center", href: "/approval", icon: CheckSquare, badge: 12, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Notifikasi", href: "/notifikasi", icon: Bell },
    ],
  },
  {
    label: "Kepegawaian",
    items: [
      { title: "Data Pegawai", href: "/pegawai", icon: Users, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Profil Pegawai", href: "/pegawai/profil", icon: UserCircle },
      { title: "Struktur Organisasi", href: "/organisasi", icon: Building2, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Formasi Jabatan", href: "/formasi", icon: Briefcase, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Mutasi", href: "/mutasi", icon: ArrowRightLeft, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Kehadiran",
    items: [
      { title: "Absensi", href: "/absensi", icon: Clock },
      { title: "Absensi Selfie", href: "/absensi/selfie", icon: Camera },
      { title: "Cuti & Izin", href: "/cuti", icon: CalendarDays },
      { title: "Koreksi Absensi", href: "/absensi/koreksi", icon: FileCheck, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Lokasi Absensi", href: "/settings/lokasi", icon: Navigation, allowedRoles: ["super_admin", "hrd"] },
    ],
  },
  {
    label: "Remunerasi",
    items: [
      { title: "Payroll", href: "/payroll", icon: Wallet, allowedRoles: ["super_admin", "hrd"] },
      { title: "Slip Gaji", href: "/slip-gaji", icon: Receipt },
      { title: "Kenaikan Gaji Berkala", href: "/kgb", icon: ArrowUpCircle, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Kinerja & Karier",
    items: [
      { title: "KPI & Penilaian", href: "/kpi", icon: Target, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Kenaikan Pangkat", href: "/kenaikan-pangkat", icon: Star, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { title: "Dokumen Kepegawaian", href: "/dokumen", icon: FolderOpen },
      { title: "Surat Keputusan", href: "/sk", icon: FileSignature, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "SP / Surat Peringatan", href: "/sp", icon: AlertTriangle, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { title: "User Management", href: "/settings/users", icon: UserCog, allowedRoles: ["super_admin", "hrd"] },
      { title: "Role & Permission", href: "/settings/role", icon: ShieldCheck, allowedRoles: ["super_admin", "hrd"] },
    ],
  },
]

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav() {
  const pathname = usePathname()
  const { role, user, logout } = useAuth()

  const filteredNavigation = useMemo(() => {
    return navigation
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.allowedRoles || (role && item.allowedRoles.includes(role))),
      }))
      .filter((group) => group.items.length > 0)
  }, [role])

  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    filteredNavigation
      .filter((group) => group.items.some((item) => isItemActive(pathname, item.href)))
      .map((group) => group.label)
  )

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => (prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]))
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white overflow-hidden">
          <Image src="/logo-tar.png" alt="Logo TAR" width={32} height={32} className="object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-sidebar-foreground">SIMPEG</span>
          <span className="truncate text-[10px] text-sidebar-muted">PDAM Tirta Ardhia Rinjani</span>
        </div>
      </div>

      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="text-sm font-semibold text-sidebar-foreground">{user?.name ?? "Guest"}</div>
        <div className="mt-1 text-xs text-sidebar-muted">{role ? roleLabels[role] : "Belum login"}</div>
        <div className="mt-1 text-xs text-sidebar-muted">{user?.unit}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-1">
          {filteredNavigation.map((group) => (
            <div key={group.label} className="mb-2">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground"
              >
                {group.label}
                {expandedGroups.includes(group.label) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {expandedGroups.includes(group.label) && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = isItemActive(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          isActive
                            ? "sidebar-active text-sidebar-primary-foreground shadow-md"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground")} />
                        <span className="truncate">{item.title}</span>
                        {item.badge ? (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">{item.badge}</span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
