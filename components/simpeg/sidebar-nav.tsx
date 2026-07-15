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
  ChevronLeft, LogOut, X, Menu, Settings, Upload, Shield, CalendarRange, Trophy, ClipboardCheck,
  Megaphone
} from "lucide-react"

type NavItem = {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
  allowedRoles?: Array<"super_admin" | "hrd" | "direktur" | "pegawai" | "kepala_bidang" | "kepala_cabang">
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
      { title: "Pengumuman Berjalan", href: "/pengumuman", icon: Megaphone, allowedRoles: ["super_admin", "hrd", "direktur"] },
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
      { title: "Kalender Kehadiran", href: "/kalender", icon: CalendarRange },
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
      { title: "Indeks Pegawai", href: "/indeks", icon: Trophy },
      { title: "Penilaian Pegawai", href: "/penilaian", icon: ClipboardCheck, allowedRoles: ["super_admin", "hrd", "direktur", "kepala_bidang", "kepala_cabang"] },
      { title: "KPI & Penilaian", href: "/kpi", icon: Target, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Kenaikan Pangkat", href: "/kenaikan-pangkat", icon: Star, allowedRoles: ["super_admin", "hrd", "direktur"] },
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
    SUPERADMIN:    { label: "Super Admin",   color: "bg-blue-600" },
    HRD:           { label: "HRD / Admin",   color: "bg-blue-500" },
    DIREKSI:       { label: "Direksi",       color: "bg-amber-500" },
    KEPALA_BIDANG: { label: "Kepala Bidang", color: "bg-teal-500" },
    KEPALA_CABANG: { label: "Kepala Cabang", color: "bg-emerald-500" },
    PEGAWAI:       { label: "Pegawai",       color: "bg-green-500" },
  }

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isMobile ? "0px" : collapsed ? "4.5rem" : "260px"
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
            r === "kepala_bidang" ? "KEPALA_BIDANG" :
            r === "kepala_cabang" ? "KEPALA_CABANG" :
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
        "flex items-center shrink-0",
        (!isMobileMode && collapsed) ? "justify-center px-2 h-16" : "justify-between px-5 h-[68px]"
      )}>
        <div className={cn("flex items-center gap-3 min-w-0", (!isMobileMode && collapsed) && "justify-center")}>
          <div className={cn(
            "flex items-center justify-center rounded-xl overflow-hidden shrink-0",
            (!isMobileMode && collapsed) ? "h-9 w-9" : "h-10 w-10"
          )}>
            <Image src="/logo-tar.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          {(isMobileMode || !collapsed) && (
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold tracking-tight text-[#1E293B] dark:text-[#f4f4f5]">SIMPEG</span>
              <span className="truncate text-[11px] text-[#94A3B8] dark:text-[#a1a1aa] leading-tight">PDAM Tirta Ardhia Rinjani</span>
            </div>
          )}
        </div>
        {isMobileMode && (
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#94A3B8] dark:text-[#a1a1aa] hover:bg-[#F3F4F6] dark:hover:bg-[#27272a] hover:text-[#64748B] dark:hover:text-[#d4d4d8] transition-all duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!isMobileMode && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#94A3B8] dark:text-[#a1a1aa] hover:bg-[#F3F4F6] dark:hover:bg-[#27272a] hover:text-[#64748B] dark:hover:text-[#d4d4d8] transition-all duration-150"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── USER CARD ── */}
      {(isMobileMode || !collapsed) && (
        <div className="mx-4 my-2 rounded-2xl bg-[#F8FAFC] dark:bg-[#1a1a1e] border border-[#E5E7EB] dark:border-[#27272a] p-3.5">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#27272a] shadow-sm">
                <img src={session.user.image} alt={session.user.name || ""} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                roleInfo?.color || "bg-blue-600"
              )}>
                {getInitials(session?.user?.name)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#1E293B] dark:text-[#f4f4f5] truncate leading-tight">
                {session?.user?.name || "User"}
              </div>
              <div className="text-[11px] text-[#94A3B8] dark:text-[#a1a1aa] mt-0.5">
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
          className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-xl text-[#94A3B8] dark:text-[#a1a1aa] hover:bg-[#F3F4F6] dark:hover:bg-[#27272a] hover:text-[#64748B] dark:hover:text-[#d4d4d8] transition-all duration-150"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* ── NAVIGATION ── */}
      <div className={cn("flex-1 overflow-y-auto py-3", (!isMobileMode && collapsed) ? "px-2" : "px-3")}>
        <nav className="flex flex-col gap-0.5">
          {filteredNavigation.map((group) => {
            const isExpanded = expandedGroups.includes(group.label)
            const hasActive = group.items.some(i => isItemActive(pathname, i.href))

            return (
              <div key={group.label} className="mb-0.5">
                {/* Group Header — section label */}
                {(isMobileMode || !collapsed) && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 mt-3 first:mt-0 transition-all duration-150",
                      hasActive ? "text-[#475569] dark:text-[#d4d4d8]" : "text-[#94A3B8] dark:text-[#a1a1aa] hover:text-[#64748B] dark:hover:text-[#d4d4d8]"
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {group.label}
                    </span>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isExpanded ? "rotate-0" : "-rotate-90"
                    )} />
                  </button>
                )}

                {((!isMobileMode && collapsed) || isExpanded) && (
                  <div className="mt-0.5 flex flex-col gap-[2px]">
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
                              : "gap-3 px-3 py-[9px]",
                            isActive
                              ? "bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 font-medium"
                              : "text-[#64748B] dark:text-[#a1a1aa] hover:bg-[#F3F4F6] dark:hover:bg-[#27272a] hover:text-[#1E293B] dark:hover:text-[#f4f4f5]"
                          )}
                        >
                          {/* Active left indicator — 3px blue bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB] dark:bg-blue-500" />
                          )}
                          <item.icon className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                            isActive ? "text-[#2563EB] dark:text-blue-400" : "text-[#94A3B8] dark:text-[#a1a1aa] group-hover:text-[#64748B] dark:group-hover:text-[#d4d4d8]"
                          )} />
                          {(isMobileMode || !collapsed) && (
                            <>
                              <span className="flex-1 truncate text-[13px]">{item.title}</span>
                              {item.badge ? (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
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
        "border-t border-[#E5E7EB] dark:border-[#27272a] p-3",
        (!isMobileMode && collapsed) && "flex justify-center"
      )}>
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            "group flex items-center rounded-xl text-sm text-[#94A3B8] dark:text-[#a1a1aa] transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400",
            (!isMobileMode && collapsed) ? "justify-center p-2.5" : "w-full gap-3 px-3 py-2.5"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
          {(isMobileMode || !collapsed) && <span className="font-medium text-[13px]">Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* DESKTOP — Floating Sidebar */}
      <aside
        className={cn(
          "fixed z-40 hidden md:flex flex-col transition-all duration-300 ease-out",
          collapsed
            ? "left-3 top-3 bottom-3 w-[4.5rem] rounded-2xl bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272a]"
            : "left-4 top-4 bottom-4 w-[260px] rounded-3xl bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272a]"
        )}
        style={{
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.04), 0 1px 4px rgba(15, 23, 42, 0.02)',
        }}
      >
        {sidebarContent(false)}
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-[280px] flex-col bg-white dark:bg-[#111113] transition-transform duration-300 ease-out md:hidden border-r border-[#E5E7EB] dark:border-[#27272a]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "flex"
        )}
        style={{
          boxShadow: mobileOpen ? '8px 0 32px rgba(15, 23, 42, 0.08)' : 'none',
        }}
      >
        {sidebarContent(true)}
      </aside>
    </>
  )
}
