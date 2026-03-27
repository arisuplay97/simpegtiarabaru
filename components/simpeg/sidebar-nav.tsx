"use client"

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
  ChevronLeft, LogOut, X, Menu, Settings, Upload, Shield
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
  icon?: React.ElementType
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard },
      { title: "Dashboard Direksi", href: "/dashboard/direksi", icon: BarChart3, allowedRoles: ["super_admin", "direktur"] },
      { title: "Approval Center", href: "/approval", icon: CheckSquare, badge: 12, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Notifikasi", href: "/notifikasi", icon: Bell },
    ],
  },
  {
    label: "Kepegawaian",
    icon: Users,
    items: [
      { title: "Data Pegawai", href: "/pegawai", icon: Users, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Profil Pegawai", href: "/pegawai/profil", icon: UserCircle },
      { title: "Struktur Organisasi", href: "/organisasi", icon: Building2, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Formasi Jabatan", href: "/formasi", icon: Briefcase, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Mutasi", href: "/mutasi", icon: ArrowRightLeft, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Kontrak & Magang", href: "/kontrak", icon: FileSignature, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Kehadiran",
    icon: Clock,
    items: [
      { title: "Absensi", href: "/absensi", icon: Clock },
      { title: "Absensi Selfie", href: "/absensi/selfie", icon: Camera },
      { title: "Cuti & Izin", href: "/cuti", icon: CalendarDays },
      { title: "Koreksi Absensi", href: "/absensi/koreksi", icon: FileCheck, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Lokasi Absensi", href: "/settings/lokasi", icon: Navigation, allowedRoles: ["super_admin", "hrd"] },
      { title: "Shift & Lembur", href: "/shift", icon: Clock, allowedRoles: ["super_admin", "hrd"] },
      { title: "Import Fingerprint", href: "/absensi/import-fingerprint", icon: Upload, allowedRoles: ["super_admin", "hrd"] },
    ],
  },
  {
    label: "Remunerasi",
    icon: Wallet,
    items: [
      { title: "Payroll", href: "/payroll", icon: Wallet, allowedRoles: ["super_admin", "hrd"] },
      { title: "PPh 21", href: "/pph21", icon: Receipt, allowedRoles: ["super_admin", "hrd"] },
      { title: "Slip Gaji", href: "/slip-gaji", icon: Receipt },
      { title: "Kenaikan Gaji Berkala", href: "/kgb", icon: ArrowUpCircle, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Kinerja & Karier",
    icon: Target,
    items: [
      { title: "KPI & Penilaian", href: "/kpi", icon: Target, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Kenaikan Pangkat", href: "/kenaikan-pangkat", icon: Star, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Reward Poin", href: "/reward", icon: Star },
    ],
  },
  {
    label: "Administrasi",
    icon: FolderOpen,
    items: [
      { title: "Dokumen Kepegawaian", href: "/dokumen", icon: FolderOpen },
      { title: "Surat Keputusan", href: "/sk", icon: FileSignature, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "SP / Surat Peringatan", href: "/sp", icon: AlertTriangle, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings,
    items: [
      { title: "Pengaturan Sistem", href: "/settings/sistem", icon: Settings, allowedRoles: ["super_admin", "hrd"] },
      { title: "Kelola Bidang", href: "/settings/bidang", icon: Building2, allowedRoles: ["super_admin"] },
      { title: "User Management", href: "/settings/users", icon: UserCog, allowedRoles: ["super_admin", "hrd"] },
      { title: "Role & Permission", href: "/settings/role", icon: ShieldCheck, allowedRoles: ["super_admin", "hrd"] },
      { title: "Audit Log", href: "/audit-log", icon: Shield, allowedRoles: ["super_admin"] },
    ],
  },
]

// ---- Context ----
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

// Avatar initials helper
function getInitials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

export function SidebarNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as string | undefined
  const [collapsed, setCollapsed] = useState(false)
  const { mobileOpen, setMobileOpen } = useSidebar()

  const roleLabels: Record<string, { label: string; color: string }> = {
    SUPERADMIN: { label: "Super Admin", color: "from-violet-500 to-purple-600" },
    HRD:        { label: "HRD / Admin", color: "from-blue-500 to-indigo-600" },
    DIREKSI:    { label: "Direksi",     color: "from-amber-500 to-orange-600" },
    PEGAWAI:    { label: "Pegawai",     color: "from-emerald-500 to-teal-600" },
  }

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isMobile ? "0px" : collapsed ? "4rem" : "16rem"
    )
  }, [collapsed])

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      document.documentElement.style.setProperty("--sidebar-width", "0px")
    }
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

  const handleLogout = () => { signOut({ callbackUrl: "/login" }) }
  const handleNavClick = () => { setMobileOpen(false) }

  const roleInfo = userRole ? roleLabels[userRole] : null

  const sidebarContent = (isMobileMode: boolean) => (
    <div className="flex h-full flex-col">

      {/* ── HEADER ── */}
      <div className={cn(
        "flex h-16 items-center border-b border-white/5",
        (!isMobileMode && collapsed) ? "justify-center px-2" : "justify-between px-4"
      )}>
        <div className={cn("flex items-center gap-3 min-w-0", (!isMobileMode && collapsed) && "justify-center")}>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 overflow-hidden ring-1 ring-white/10", (!isMobileMode && collapsed) ? "h-9 w-9" : "h-12 w-12")}>
            <Image src="/logo-tar.png" alt="Logo" width={36} height={36} className="object-contain" />
          </div>
          {(isMobileMode || !collapsed) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wide text-white">SIMPEG</span>
              <span className="truncate text-[10px] text-white/40">PDAM Tirta Ardhia Rinjani</span>
            </div>
          )}
        </div>
        {isMobileMode && (
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!isMobileMode && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── USER CARD ── */}
      {(isMobileMode || !collapsed) && (
        <div className="mx-3 my-3 rounded-xl bg-white/5 border border-white/8 p-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-md",
              roleInfo?.color || "from-blue-500 to-indigo-600"
            )}>
              {getInitials(session?.user?.name)}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">
                {session?.user?.name || "User"}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {roleInfo?.label || userRole || "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expand button saat collapsed */}
      {!isMobileMode && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* ── NAVIGATION ── */}
      <div className={cn("flex-1 overflow-y-auto py-2", (!isMobileMode && collapsed) ? "px-2" : "px-3")}>
        <nav className="flex flex-col gap-0.5">
          {filteredNavigation.map((group) => {
            const isExpanded = expandedGroups.includes(group.label)
            const hasActive = group.items.some(i => isItemActive(pathname, i.href))

            return (
              <div key={group.label} className="mb-1">
                {/* Group Header */}
                {(isMobileMode || !collapsed) && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-1.5 transition-colors",
                      hasActive ? "text-white/80" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest">
                      {group.label}
                    </span>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isExpanded ? "rotate-0" : "-rotate-90"
                    )} />
                  </button>
                )}

                {((!isMobileMode && collapsed) || isExpanded) && (
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive = isItemActive(pathname, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={(!isMobileMode && collapsed) ? item.title : undefined}
                          onClick={handleNavClick}
                          className={cn(
                            "group relative flex items-center rounded-xl transition-all duration-150",
                            (!isMobileMode && collapsed)
                              ? "justify-center px-2 py-2.5"
                              : "gap-3 px-3 py-2",
                            isActive
                              ? "bg-white/12 text-white shadow-sm"
                              : "text-white/50 hover:bg-white/6 hover:text-white/90"
                          )}
                        >
                          {/* Active left indicator */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-blue-400 shadow-[0_0_8px_theme(colors.blue.400)]" />
                          )}
                          <item.icon className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-blue-400" : "text-white/40 group-hover:text-white/70"
                          )} />
                          {(isMobileMode || !collapsed) && (
                            <>
                              <span className="flex-1 truncate text-sm font-medium">{item.title}</span>
                              {item.badge ? (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white">
                                  {item.badge}
                                </span>
                              ) : null}
                            </>
                          )}
                          {!isMobileMode && collapsed && item.badge ? (
                            <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* ── FOOTER LOGOUT ── */}
      <div className={cn(
        "border-t border-white/5 p-3",
        (!isMobileMode && collapsed) && "flex justify-center"
      )}>
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            "group flex items-center rounded-xl text-sm text-white/40 transition-all hover:bg-red-500/10 hover:text-red-400",
            (!isMobileMode && collapsed) ? "justify-center p-2" : "w-full gap-3 px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 transition-colors group-hover:text-red-400" />
          {(isMobileMode || !collapsed) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* DESKTOP */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-[#0d0d12] text-sidebar-foreground transition-all duration-300 md:flex border-r border-white/5",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 flex-col bg-[#0d0d12] text-sidebar-foreground transition-transform duration-300 md:hidden border-r border-white/5",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "flex"
        )}
      >
        {sidebarContent(true)}
      </aside>
    </>
  )
}
