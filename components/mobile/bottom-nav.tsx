"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, Fingerprint, CalendarDays, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/m/dashboard", label: "Beranda", icon: Home },
  { href: "/m/slip-gaji", label: "Slip Gaji", icon: Wallet },
  { href: "/m/fingerprint", label: "Absen", icon: Fingerprint, isFab: true },
  { href: "/m/cuti", label: "Cuti & Izin", icon: CalendarDays },
  { href: "/m/profil", label: "Profil", icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  if (pathname === "/m/selfie" || pathname === "/m/fingerprint") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="relative flex h-16 items-center justify-around px-3 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-16 group"
              >
                <div
                  className="absolute -top-5 h-14 w-14 flex items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-[3px] border-white dark:border-zinc-950 shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_20px_rgba(255,255,255,0.08)] active:scale-90 transition-all duration-200 group-hover:shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
                >
                  <tab.icon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span className="text-[9px] font-bold text-zinc-900 dark:text-zinc-200 mt-7 pt-1.5 tracking-wider uppercase">
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex w-14 flex-col items-center justify-center py-1 gap-1 group active:scale-95 transition-transform"
            >
              <div
                className={cn(
                  "flex h-8 w-11 items-center justify-center rounded-full transition-all duration-200",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                )}
              >
                <tab.icon
                  className="h-4.5 w-4.5 transition-all"
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight leading-none transition-colors",
                  isActive
                    ? "font-bold text-zinc-900 dark:text-zinc-100"
                    : "font-medium text-zinc-400 dark:text-zinc-500"
                )}
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
