"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Clock, CalendarDays, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/m/dashboard", label: "Home", icon: Home },
  { href: "/m/absensi", label: "Absensi", icon: Clock },
  { href: "/m/cuti", label: "Cuti", icon: CalendarDays },
  { href: "/m/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/m/profil", label: "Profil", icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
