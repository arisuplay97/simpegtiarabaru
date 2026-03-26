"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getUnreadCount } from "@/lib/actions/notifikasi"
import {
  Search,
  Bell,
  MessageSquare,
  Settings,
  ChevronDown,
  Building2,
  User,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Menu,
} from "lucide-react"
import { useSidebar } from "@/components/simpeg/sidebar-nav"

interface TopBarProps {
  breadcrumb?: string[]
}

export function TopBar({ breadcrumb = ["Dashboard"] }: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const { setMobileOpen } = useSidebar()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
    toast.success("Berhasil logout")
  }

  const user = session?.user
  const userRole = user?.role as string | undefined

  const [unreadNotif, setUnreadNotif] = useState(0)

  useEffect(() => {
    if (user?.id) {
      getUnreadCount(user.id).then(setUnreadNotif).catch(() => {})
    }
  }, [user?.id])

  const roleLabels: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    HRD: "HRD / Admin",
    DIREKSI: "Direksi",
    PEGAWAI: "Pegawai",
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-3 md:px-6 gap-2">
      {/* Left: Hamburger (mobile) + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex md:hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && <span className="text-muted-foreground shrink-0">/</span>}
              <span
                className={cn(
                  "truncate",
                  index === breadcrumb.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground cursor-pointer hidden sm:inline"
                )}
              >
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Center: Search — hidden on mobile */}
      <div className="hidden md:flex flex-1 items-center justify-center px-6">
        <div
          className={cn(
            "relative w-full max-w-xl transition-all duration-200 group",
            searchFocused && "max-w-2xl"
          )}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari pegawai, dokumen, approval, payroll..."
            className="h-10 w-full rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 group-focus-within:pr-14"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                router.push(`/pegawai?search=${encodeURIComponent(e.currentTarget.value.trim())}`)
              }
            }}
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block group-focus-within:hidden">
            Ctrl+K
          </kbd>
          <Button 
            size="sm" 
            className="absolute right-1 top-1/2 h-8 -translate-y-1/2 hidden group-focus-within:flex"
            onClick={() => {
              if (searchRef.current?.value.trim()) {
                router.push(`/pegawai?search=${encodeURIComponent(searchRef.current.value.trim())}`)
              }
            }}
          >
            Cari
          </Button>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Branch selector — hidden on small screens */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm hidden sm:flex">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Kantor Pusat</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Pilih Unit Kerja</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Kantor Pusat</DropdownMenuItem>
            <DropdownMenuItem>Kantor Cabang</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Notifications */}
        <Link href="/notifikasi" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="relative h-9 w-9" asChild>
            <a href="/notifikasi">
              <Bell className="h-5 w-5" />
              {unreadNotif > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                  {unreadNotif > 99 ? '99+' : unreadNotif}
                </Badge>
              )}
            </a>
          </Button>
        </Link>

        {/* Messages — hidden on mobile */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 hidden sm:flex">
          <MessageSquare className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
            3
          </Badge>
        </Button>

        {/* Settings — hidden on mobile */}
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
          <Settings className="h-5 w-5" />
        </Button>

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1 pr-2 h-9">
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">{user?.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left lg:flex">
                <span className="text-sm font-medium leading-none">{user?.name ?? "Guest"}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{userRole ? roleLabels[userRole] : ""}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate">{user?.name ?? "User"}</span>
                  <Badge className="text-[10px]">
                    {userRole ? roleLabels[userRole] : "Guest"}
                  </Badge>
                </div>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/pegawai/profil" className="flex items-center w-full">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Bantuan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
