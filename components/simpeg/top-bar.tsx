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
import { getSearchSuggestions } from "@/lib/actions/pegawai"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  Search,
  Bell,
  MessageSquare,
  Settings,
  ChevronDown,
  User,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Menu,
  CalendarDays,
  PanelLeft,
  Smartphone,
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
  const { setMobileOpen, collapsed, setCollapsed } = useSidebar()
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-md px-4 sm:px-6 gap-3">
      {/* Left: Hamburger (mobile) + Page Icon Badge + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex md:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>



        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] min-w-0">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-2 min-w-0">
              {index > 0 && <span className="text-slate-300 dark:text-zinc-600 shrink-0">/</span>}
              <span
                className={cn(
                  "truncate",
                  index === breadcrumb.length - 1
                    ? "font-bold text-slate-900 dark:text-zinc-100 text-[14px]"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors hidden sm:inline"
                )}
              >
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Center: Search — hidden on mobile */}
      <div className="hidden md:flex flex-1 items-center justify-center px-4">
        <div
          className={cn(
            "relative w-full max-w-lg transition-all duration-200 group",
            searchFocused && "max-w-xl"
          )}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] dark:text-[#a1a1aa]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari pegawai, dokumen, approval... Ctrl+K"
            className="h-11 w-full rounded-full border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#111113] pl-11 pr-4 text-[13px] text-[#1E293B] dark:text-[#f4f4f5] placeholder:text-[#94A3B8] dark:placeholder:text-[#a1a1aa] focus:border-[#2563EB] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 dark:focus:ring-blue-500/15 group-focus-within:pr-14 transition-all duration-200"
            style={{ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}
            onFocus={() => {
              setSearchFocused(true)
              if (searchRef.current?.value.length && searchRef.current.value.length >= 2) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              setSearchFocused(false)
              // Delay hides to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            onChange={async (e) => {
              const val = e.target.value
              if (val.length >= 2) {
                setIsSearching(true)
                setShowSuggestions(true)
                const res = await getSearchSuggestions(val)
                setSuggestions(res)
                setIsSearching(false)
              } else {
                setSuggestions([])
                setShowSuggestions(false)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                router.push(`/pegawai?search=${encodeURIComponent(e.currentTarget.value.trim())}`)
                setShowSuggestions(false)
              }
            }}
          />
          <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-[#E5E7EB] dark:border-[#27272a] bg-[#F8FAFC] dark:bg-[#1a1a1e] px-2 py-0.5 text-[10px] font-medium text-[#94A3B8] dark:text-[#a1a1aa] sm:block group-focus-within:hidden">
            Ctrl+K
          </kbd>
          <Button 
            size="sm" 
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 hidden group-focus-within:flex rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-medium"
            onClick={() => {
              if (searchRef.current?.value.trim()) {
                router.push(`/pegawai?search=${encodeURIComponent(searchRef.current.value.trim())}`)
                setShowSuggestions(false)
              }
            }}
          >
            Cari
          </Button>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-auto rounded-2xl border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#111113] z-50 animate-in fade-in zoom-in duration-200"
              style={{ boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)' }}
            >
              {isSearching && suggestions.length === 0 ? (
                <div className="flex items-center justify-center p-4 text-[13px] text-[#94A3B8] dark:text-[#a1a1aa]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2563EB] dark:border-blue-500 border-t-transparent mr-2" />
                  Mencari...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#a1a1aa]">
                    Saran Pegawai
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1a1a1e] transition-colors duration-150"
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevent blur before navigation
                        router.push(`/pegawai/${s.id}`)
                        setShowSuggestions(false)
                        if (searchRef.current) searchRef.current.value = ""
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.fotoUrl || ""} />
                        <AvatarFallback className="text-[10px] bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 font-semibold">{s.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#1E293B] dark:text-[#f4f4f5] truncate">{s.nama}</p>
                        <p className="text-[10px] text-[#94A3B8] dark:text-[#a1a1aa] truncate">{s.nik} • {s.jabatan}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Date Pill (like reference image) */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/70 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
          <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{format(new Date(), "EEE, dd MMM yyyy", { locale: id })}</span>
        </div>

        {/* Notifications */}
        <Link href="/notifikasi" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" asChild>
            <a href="/notifikasi" aria-label="Notifikasi">
              <Bell className="h-[18px] w-[18px]" />
              {unreadNotif > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
              )}
            </a>
          </Button>
        </Link>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative h-9 w-9 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Ubah tema"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        {/* Settings — hidden on mobile */}
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" asChild>
          <Link href="/settings/sistem" aria-label="Pengaturan">
            <Settings className="h-[18px] w-[18px]" />
          </Link>
        </Button>

        <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2.5 pl-1 pr-2.5 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
              <Avatar className="h-8 w-8 ring-2 ring-blue-500/20 dark:ring-blue-400/20">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-blue-600 text-xs text-white font-bold tracking-tight">
                  {userRole === "HRD" ? "HR" : (user?.name?.slice(0, 2).toUpperCase() || "US")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left xl:flex">
                <span className="text-[13px] font-semibold leading-none text-slate-900 dark:text-zinc-100 truncate max-w-[120px]">{user?.name ?? "User"}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{userRole ? roleLabels[userRole] : ""}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 dark:border-zinc-800 dark:bg-[#111113] p-1 shadow-xl">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-[#1E293B] dark:text-[#f4f4f5]">{user?.name ?? "User"}</span>
                  <Badge className="text-[10px] bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 border-0 rounded-lg">
                    {userRole ? roleLabels[userRole] : "Guest"}
                  </Badge>
                </div>
                <span className="text-xs font-normal text-[#94A3B8] dark:text-[#a1a1aa]">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E5E7EB] dark:bg-[#27272a]" />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/pegawai/profil" className="flex items-center w-full text-[#64748B] dark:text-[#a1a1aa] hover:text-[#1E293B] dark:hover:text-[#f4f4f5] focus:bg-[#F3F4F6] dark:focus:bg-[#27272a]">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl text-[#64748B] dark:text-[#a1a1aa] hover:text-[#1E293B] dark:hover:text-[#f4f4f5] focus:bg-[#F3F4F6] dark:focus:bg-[#27272a]">
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl text-[#64748B] dark:text-[#a1a1aa] hover:text-[#1E293B] dark:hover:text-[#f4f4f5] focus:bg-[#F3F4F6] dark:focus:bg-[#27272a]">
              <HelpCircle className="mr-2 h-4 w-4" />
              Bantuan
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:bg-blue-50 dark:focus:bg-blue-950/30 cursor-pointer"
              onClick={() => {
                document.cookie = "simpeg_view=mobile; path=/; max-age=604800; SameSite=Lax"
                window.location.href = "/m/dashboard?view=mobile"
              }}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Buka Versi Mobile (PWA)
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E5E7EB] dark:bg-[#27272a]" />
            <DropdownMenuItem className="rounded-xl text-red-500 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
