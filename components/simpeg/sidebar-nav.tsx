"use client"

import { useMemo, useState, useEffect, createContext, useContext, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutGrid, TrendingUp, BadgeCheck, BellRing, Megaphone, Sparkles,
  Contact2, IdCard, Network, Briefcase, ArrowLeftRight, ScrollText,
  ScanFace, Camera, CalendarDays, CalendarOff, FilePenLine, MapPin, Hourglass, Fingerprint,
  Banknote, ReceiptText, FileSpreadsheet, ArrowUpRight,
  Medal, CheckCheck, Target, Award,
  Files, FileSignature, ShieldAlert,
  Settings2, Building2, UserCog, KeyRound, History, Bot, Smile,
  ChevronRight, ChevronLeft, LogOut, X, Menu
} from "lucide-react"
import { VerifiedBadge } from "@/components/simpeg/verified-badge"

type NavItem = {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
  labelBadge?: string
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
    icon: LayoutGrid,
    items: [
      { title: "Dashboard Utama", href: "/dashboard", icon: LayoutGrid },
      { title: "Dashboard Direksi", href: "/dashboard/direksi", icon: TrendingUp, allowedRoles: ["super_admin", "direktur"] },
      { title: "Approval Center", href: "/approval", icon: BadgeCheck, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Notifikasi", href: "/notifikasi", icon: BellRing },
      { title: "Pengumuman", href: "/pengumuman", icon: Megaphone, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Tiara Assistant", href: "/assistant", icon: Bot, labelBadge: "AI" },
    ],
  },
  {
    label: "Kepegawaian",
    icon: Contact2,
    items: [
      { title: "Data Pegawai", href: "/pegawai", icon: Contact2, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Profil Pegawai", href: "/pegawai/profil", icon: IdCard },
      { title: "Struktur Organisasi", href: "/organisasi", icon: Network, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Formasi Jabatan", href: "/formasi", icon: Briefcase, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Mutasi", href: "/mutasi", icon: ArrowLeftRight, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Kontrak & Magang", href: "/kontrak", icon: ScrollText, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Kehadiran",
    icon: CalendarDays,
    items: [
      { title: "Absensi", href: "/absensi", icon: ScanFace },
      { title: "Employee Experience", href: "/employee-experience", icon: Smile, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Absensi Selfie", href: "/absensi/selfie", icon: Camera },
      { title: "Kalender Kehadiran", href: "/kalender", icon: CalendarDays },
      { title: "Cuti & Izin", href: "/cuti", icon: CalendarOff },
      { title: "Koreksi Absensi", href: "/absensi/koreksi", icon: FilePenLine, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Lokasi Absensi", href: "/settings/lokasi", icon: MapPin, allowedRoles: ["super_admin", "hrd"] },
      { title: "Shift & Lembur", href: "/shift", icon: Hourglass, allowedRoles: ["super_admin", "hrd"] },
      { title: "Import Fingerprint", href: "/absensi/import-fingerprint", icon: Fingerprint, allowedRoles: ["super_admin", "hrd"] },
    ],
  },
  {
    label: "Remunerasi",
    icon: Banknote,
    items: [
      { title: "Payroll", href: "/payroll", icon: Banknote, allowedRoles: ["super_admin", "hrd"] },
      { title: "PPh 21", href: "/pph21", icon: ReceiptText, allowedRoles: ["super_admin", "hrd"] },
      { title: "Slip Gaji", href: "/slip-gaji", icon: FileSpreadsheet },
      { title: "Kenaikan Gaji Berkala", href: "/kgb", icon: ArrowUpRight, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Kinerja & Karier",
    icon: Target,
    items: [
      { title: "Indeks Pegawai", href: "/indeks", icon: Medal },
      { title: "Penilaian Pegawai", href: "/penilaian", icon: CheckCheck, allowedRoles: ["super_admin", "hrd", "direktur", "kepala_bidang", "kepala_cabang"] },
      { title: "KPI & Penilaian", href: "/kpi", icon: Target, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "Kenaikan Pangkat", href: "/kenaikan-pangkat", icon: Award, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Administrasi",
    icon: Files,
    items: [
      { title: "Dokumen Kepegawaian", href: "/dokumen", icon: Files },
      { title: "Surat Keputusan", href: "/sk", icon: FileSignature, allowedRoles: ["super_admin", "hrd", "direktur"] },
      { title: "SP / Surat Peringatan", href: "/sp", icon: ShieldAlert, allowedRoles: ["super_admin", "hrd", "direktur"] },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings2,
    items: [
      { title: "Pengaturan Sistem", href: "/settings/sistem", icon: Settings2, allowedRoles: ["super_admin", "hrd"] },
      { title: "Kelola Bidang", href: "/settings/bidang", icon: Building2, allowedRoles: ["super_admin"] },
      { title: "User Management", href: "/settings/users", icon: UserCog, allowedRoles: ["super_admin", "hrd"] },
      { title: "Role & Permission", href: "/settings/role", icon: KeyRound, allowedRoles: ["super_admin", "hrd"] },
      { title: "Audit Log", href: "/audit-log", icon: History, allowedRoles: ["super_admin"] },
    ],
  },
]

// ---- Context ----
type SidebarCtx = {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarCtx>({
  mobileOpen: false,
  setMobileOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapse: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapse = () => setCollapsed((prev) => !prev)

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        collapsed,
        setCollapsed,
        toggleCollapse,
      }}
    >
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
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed } = useSidebar()

  const isSuperAdmin = useMemo(() => {
    const role = (userRole || (session?.user as any)?.role || "").toString().toLowerCase()
    const name = (session?.user?.name || "").toLowerCase()
    return role === "superadmin" || role === "super_admin" || name.includes("super admin")
  }, [userRole, session?.user])

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
      isMobile ? "0px" : collapsed ? "72px" : "260px"
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

  const [approvalCount, setApprovalCount] = useState<number | null>(null)

  const isApprovalRole = useMemo(() => {
    if (!userRole) return false
    const normalized = userRole.toUpperCase()
    return normalized === "SUPERADMIN" || normalized === "HRD" || normalized === "DIREKSI"
  }, [userRole])

  const fetchApprovalCount = useCallback(async () => {
    if (!isApprovalRole) {
      setApprovalCount(null)
      return
    }
    try {
      const res = await fetch("/api/approval/count", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setApprovalCount(typeof data.count === "number" ? data.count : null)
      }
    } catch {
      // ignore
    }
  }, [isApprovalRole])

  useEffect(() => {
    fetchApprovalCount()

    // Dengarkan event update persetujuan dari modul approval atau dashboard
    const handleUpdate = () => {
      fetchApprovalCount()
    }
    window.addEventListener("approval-updated", handleUpdate)
    window.addEventListener("focus", handleUpdate)

    return () => {
      window.removeEventListener("approval-updated", handleUpdate)
      window.removeEventListener("focus", handleUpdate)
    }
  }, [fetchApprovalCount])

  const filteredNavigation = useMemo(() => {
    return navigation
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
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
          })
          .map((item) => {
            if (item.href === "/approval") {
              return {
                ...item,
                badge: approvalCount && approvalCount > 0 ? approvalCount : undefined,
              }
            }
            return item
          }),
      }))
      .filter((group) => group.items.length > 0)
  }, [userRole, approvalCount])

  const handleLogout = () => { signOut({ callbackUrl: "/login" }) }
  const handleNavClick = () => { setMobileOpen(false) }

  const roleInfo = userRole ? roleLabels[userRole] : null

  const sidebarContent = (isMobileMode: boolean) => (
    <div className="flex h-full flex-col">

      {/* ── HEADER ── */}
      <div className={cn(
        "flex items-center shrink-0 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-[#0f0f11]",
        (!isMobileMode && collapsed) ? "justify-center px-2 h-16" : "justify-between px-4 h-16"
      )}>
        <div className={cn("flex items-center gap-3 min-w-0", (!isMobileMode && collapsed) && "justify-center")}>
          <div className={cn(
            "flex items-center justify-center rounded-xl overflow-hidden shrink-0 bg-blue-50/70 dark:bg-zinc-800/60 p-1 border border-slate-200/60 dark:border-zinc-700/60",
            (!isMobileMode && collapsed) ? "h-10 w-10" : "h-10 w-10"
          )}>
            <Image src="/favicon.PNG" alt="Logo" width={34} height={34} className="object-contain" />
          </div>
          {(isMobileMode || !collapsed) && (
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">SIMPEG</span>
              <span className="truncate text-[11px] font-medium text-slate-500 dark:text-zinc-400 leading-tight">PDAM Tirta Ardhia Rinjani</span>
            </div>
          )}
        </div>
        {isMobileMode && (
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* ── USER CARD ── */}
      {(isMobileMode || !collapsed) && (
        <div className="mx-3 my-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 p-3">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-zinc-700 shadow-xs">
                <img src={session.user.image} alt={session.user.name || ""} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs",
                roleInfo?.color || "bg-blue-600"
              )}>
                {getInitials(session?.user?.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[13px] font-semibold text-slate-800 dark:text-zinc-100 truncate leading-tight">
                  {session?.user?.name || "User"}
                </span>
                {isSuperAdmin && (
                  <VerifiedBadge className="w-4 h-4 shrink-0" />
                )}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                {roleInfo?.label || userRole || "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NAVIGATION ── */}
      <div className={cn("flex-1 overflow-y-auto py-2", (!isMobileMode && collapsed) ? "px-2" : "px-3")}>
        <nav className="flex flex-col gap-0.5">
          {filteredNavigation.map((group) => {
            return (
              <div key={group.label} className="mb-2">
                {/* Static Category Label */}
                {(isMobileMode || !collapsed) && (
                  <div className="px-2.5 pt-3 pb-1 first:pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
                      {group.label}
                    </span>
                  </div>
                )}

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
                            : "gap-3 px-3 py-2",
                          isActive
                            ? "bg-blue-50/90 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100"
                        )}
                      >
                        {/* Active left indicator */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600 dark:bg-blue-500" />
                        )}
                        <item.icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300"
                          )}
                          strokeWidth={1.75}
                        />
                        {(isMobileMode || !collapsed) && (
                          <>
                            <span className="flex-1 truncate text-[13px]">{item.title}</span>
                            {item.labelBadge ? (
                              <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white tracking-widest uppercase shadow-2xs">
                                {item.labelBadge}
                              </span>
                            ) : null}
                            {item.badge ? (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                                {item.badge}
                              </span>
                            ) : null}
                          </>
                        )}
                        {!isMobileMode && collapsed && item.labelBadge ? (
                          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 ring-2 ring-white dark:ring-[#0f0f11] animate-pulse" />
                        ) : null}
                        {!isMobileMode && collapsed && item.badge ? (
                          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {/* ── FOOTER LOGOUT ── */}
      <div className={cn(
        "border-t border-slate-100 dark:border-zinc-800/80 p-3 bg-white dark:bg-[#0f0f11]",
        (!isMobileMode && collapsed) && "flex justify-center"
      )}>
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            "group flex items-center rounded-xl text-sm text-slate-500 dark:text-zinc-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400",
            (!isMobileMode && collapsed) ? "justify-center p-2.5" : "w-full gap-3 px-3 py-2"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 transition-colors duration-150 group-hover:text-red-600 dark:group-hover:text-red-400" strokeWidth={1.75} />
          {(isMobileMode || !collapsed) && <span className="font-medium text-[13px]">Keluar Sistem</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* DESKTOP — Docked Enterprise Sidebar (NON-FLOATING) */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col h-screen bg-white dark:bg-[#0f0f11] border-r border-slate-200/90 dark:border-zinc-800 transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 h-screen w-[280px] flex-col bg-white dark:bg-[#0f0f11] border-r border-slate-200/90 dark:border-zinc-800 transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "flex"
        )}
      >
        {sidebarContent(true)}
      </aside>
    </>
  )
}
