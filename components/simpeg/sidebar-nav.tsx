"use client"
// components/simpeg/sidebar-nav.tsx — Mobile responsive with off-canvas drawer

import { useMemo, useState, useEffect, createContext, useContext } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, UserCircle, Building2, Briefcase,
  ArrowRightLeft, Clock, Camera, CalendarDays, FileCheck,
  Navigation, Wallet, Receipt, ArrowUpCircle, Target, Star,
  FolderOpen, FileSignature, ShieldCheck, UserCog, Bell,
  CheckSquare, BarChart3, AlertTriangle, ChevronDown, ChevronRight,
  ChevronLeft, LogOut, X, Menu,
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
      { title: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard },
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
      { title: "Kelola Bidang", href: "/settings/bidang", icon: Building2, allowedRoles: ["super_admin"] },
      { title: "User Management", href: "/settings/users", icon: UserCog, allowedRoles: ["super_admin", "hrd"] },
      { title: "Role & Permission", href: "/settings/role", icon: ShieldCheck, allowedRoles: ["super_admin", "hrd"] },
    ],
  },
]

// ---- Context: share mobileOpen state between SidebarNav & TopBar ----
type SidebarCtx = { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }
const SidebarContext = createContext<SidebarCtx>({ mobileOpen: false, setMobileOpen: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as string | undefined
  const [collapsed, setCollapsed] = useState(false)
  const { mobileOpen, setMobileOpen } = useSidebar()

  const roleLabels: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    HRD: "HRD / Admin",
    DIREKSI: "Direksi",
    PEGAWAI: "Pegawai",
  }

  // Update CSS variable on desktop collapse
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isMobile ? "0px" : collapsed ? "4rem" : "16rem"
    )
  }, [collapsed])

  // Update CSS variable on mobile open/close
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      document.documentElement.style.setProperty("--sidebar-width", "0px")
    }
    // Lock body scroll when mobile sidebar is open
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const filteredNavigation = useMemo(() => {
    return navigation
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.allowedRoles) return true
          if (!userRole) return false
          const normalizedAllowed = item.allowedRoles.map(r =>
            r === "super_admin" ? "SUPERADMIN" :
            r === "direktur" ? "DIREKSI" :
            r.toUpperCase()
          )
          return normalizedAllowed.includes(userRole)
        }),
      }))
      .filter((group) => group.items.length > 0)
  }, [userRole])

  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    filteredNavigation
      .filter((group) => group.items.some((item) => isItemActive(pathname, item.href)))
      .map((group) => group.label)
  )

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  const handleNavClick = () => {
    // On mobile: close drawer when a link is clicked
    setMobileOpen(false)
  }

  const sidebarContent = (isMobileMode: boolean) => (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
        (!isMobileMode && collapsed) ? "justify-center px-2" : "justify-between px-4"
      )}>
        <div className={cn("flex items-center gap-3 min-w-0", (!isMobileMode && collapsed) && "justify-center")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white overflow-hidden">
            <Image src="/logo-tar.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          {(isMobileMode || !collapsed) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-sidebar-foreground">SIMPEG</span>
              <span className="truncate text-[10px] text-sidebar-muted">PDAM Tirta Ardhia Rinjani</span>
            </div>
          )}
        </div>

        {/* Close button for mobile */}
        {isMobileMode && (
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Desktop collapse button */}
        {!isMobileMode && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Perkecil sidebar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* USER INFO */}
      {(isMobileMode || !collapsed) && (
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="text-sm font-semibold text-sidebar-foreground truncate">{session?.user?.name || "User"}</div>
          <div className="mt-1 text-xs text-sidebar-muted">{userRole ? (roleLabels[userRole] || userRole) : "Belum login"}</div>
        </div>
      )}

      {/* Expand button saat collapsed (desktop only) */}
      {!isMobileMode && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Perluas sidebar"
          className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* NAVIGASI */}
      <div className={cn("flex-1 overflow-y-auto py-4", (!isMobileMode && collapsed) ? "px-2" : "px-3")}>
        <nav className="flex flex-col gap-1">
          {filteredNavigation.map((group) => (
            <div key={group.label} className="mb-2">
              {(isMobileMode || !collapsed) && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground"
                >
                  {group.label}
                  {expandedGroups.includes(group.label)
                    ? <ChevronDown className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />}
                </button>
              )}

              {((!isMobileMode && collapsed) || expandedGroups.includes(group.label)) && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = isItemActive(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={(!isMobileMode && collapsed) ? item.title : undefined}
                        onClick={handleNavClick}
                        className={cn(
                          "group flex items-center rounded-lg transition-all duration-200",
                          (!isMobileMode && collapsed)
                            ? "justify-center px-2 py-2.5"
                            : "gap-3 px-3 py-2",
                          isActive
                            ? "sidebar-active text-sidebar-primary-foreground shadow-md"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0",
                          isActive
                            ? "text-sidebar-primary-foreground"
                            : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"
                        )} />
                        {(isMobileMode || !collapsed) && (
                          <>
                            <span className="truncate text-sm">{item.title}</span>
                            {item.badge ? (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
                                {item.badge}
                              </span>
                            ) : null}
                          </>
                        )}
                        {!isMobileMode && collapsed && item.badge ? (
                          <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                            {item.badge}
                          </span>
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

      {/* FOOTER LOGOUT */}
      <div className={cn("border-t border-sidebar-border p-3", (!isMobileMode && collapsed) && "flex justify-center")}>
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            "flex items-center rounded-lg text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            (!isMobileMode && collapsed) ? "justify-center p-2" : "w-full gap-3 px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(isMobileMode || !collapsed) && <span>Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ===== DESKTOP SIDEBAR (md and above) ===== */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== MOBILE DRAWER ===== */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "flex"
        )}
      >
        {sidebarContent(true)}
      </aside>
    </>
  )
}
