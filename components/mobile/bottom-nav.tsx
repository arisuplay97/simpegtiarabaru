"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Fingerprint, CalendarDays, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  {
    href: "/m/dashboard",
    label: "Beranda",
    icon: Home,
    activeColor: "#7c3aed",
    activeBg: "#ede9fe",
  },
  {
    href: "/m/absensi",
    label: "Histori",
    icon: FileText,
    activeColor: "#0ea5e9",
    activeBg: "#e0f2fe",
  },
  {
    href: "/m/selfie",
    label: "Absen",
    icon: Fingerprint,
    isFab: true,
  },
  {
    href: "/m/cuti",
    label: "Cuti & Izin",
    icon: CalendarDays,
    activeColor: "#10b981",
    activeBg: "#d1fae5",
  },
  {
    href: "/m/profil",
    label: "Profil",
    icon: User,
    activeColor: "#f59e0b",
    activeBg: "#fef3c7",
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  if (pathname === "/m/selfie") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(148,163,184,0.15)",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.08)",
        borderRadius: "24px 24px 0 0",
      }}
    >
      <div className="relative flex h-[68px] items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group relative flex flex-col items-center justify-center w-16"
              >
                {/* FAB */}
                <div
                  className="absolute -top-8 h-[60px] w-[60px] flex items-center justify-center rounded-full border-4 border-white active:scale-95 transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
                    boxShadow: "0 8px 24px rgba(124,58,237,0.5)",
                  }}
                >
                  <tab.icon className="h-6 w-6 text-white stroke-[2.5px]" />
                </div>
                <span className="text-[9px] font-black text-violet-600 mt-8 pt-1 tracking-wide uppercase">{tab.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex w-14 flex-col items-center justify-center py-2 gap-1 transition-all"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200",
                )}
                style={
                  isActive
                    ? { background: tab.activeColor ? `${tab.activeColor}18` : "#ede9fe" }
                    : {}
                }
              >
                <tab.icon
                  className={cn("h-5 w-5 transition-all")}
                  style={{
                    color: isActive ? tab.activeColor : "#94a3b8",
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />
              </div>
              <span
                className="text-[9px] font-black leading-none tracking-wide transition-colors"
                style={{ color: isActive ? tab.activeColor : "#94a3b8" }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
