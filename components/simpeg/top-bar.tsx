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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E8EAF0] bg-white px-3 md:px-5 gap-2">
      {/* Left: Hamburger (mobile) + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex md:hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5 text-[#64748B]" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px] min-w-0">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && <span className="text-[#D1D5DB] shrink-0">/</span>}
              <span
                className={cn(
                  "truncate",
                  index === breadcrumb.length - 1
                    ? "font-medium text-[#1E293B]"
                    : "text-[#9CA3AF] hover:text-[#64748B] cursor-pointer hidden sm:inline"
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
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari pegawai, dokumen, approval, payroll... Ctrl+K"
            className="h-10 w-full rounded-full border border-[#E8EAF0] bg-[#F5F6FA] pl-10 pr-4 text-[13px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15 group-focus-within:pr-14 transition-all"
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
          <kbd className="absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#E8EAF0] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#9CA3AF] sm:block group-focus-within:hidden">
            Ctrl+K
          </kbd>
          <Button 
            size="sm" 
            className="absolute right-1 top-1/2 h-8 -translate-y-1/2 hidden group-focus-within:flex rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs"
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
            <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-auto rounded-xl border border-[#E8EAF0] bg-white shadow-lg z-50 animate-in fade-in zoom-in duration-200">
              {isSearching && suggestions.length === 0 ? (
                <div className="flex items-center justify-center p-4 text-[13px] text-[#9CA3AF]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent mr-2" />
                  Mencari...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Saran Pegawai
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F5F6FA] transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevent blur before navigation
                        router.push(`/pegawai/${s.id}`)
                        setShowSuggestions(false)
                        if (searchRef.current) searchRef.current.value = ""
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.fotoUrl || ""} />
                        <AvatarFallback className="text-[10px] bg-[#EEF2FF] text-[#4F46E5] font-semibold">{s.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#1E293B] truncate">{s.nama}</p>
                        <p className="text-[10px] text-[#9CA3AF] truncate">{s.nik} • {s.jabatan}</p>
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
      <div className="flex items-center gap-1 shrink-0">
        {/* Notifications */}
        <Link href="/notifikasi" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F3F4F6]" asChild>
            <a href="/notifikasi">
              <Bell className="h-[18px] w-[18px]" />
              {unreadNotif > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </a>
          </Button>
        </Link>

        {/* Messages — hidden on mobile */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 hidden sm:flex text-[#64748B] hover:text-[#1E293B] hover:bg-[#F3F4F6]">
          <MessageSquare className="h-[18px] w-[18px]" />
        </Button>

        {/* Settings — hidden on mobile */}
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex text-[#64748B] hover:text-[#1E293B] hover:bg-[#F3F4F6]">
          <Settings className="h-[18px] w-[18px]" />
        </Button>

        <div className="h-6 w-px bg-[#E8EAF0] mx-1 hidden sm:block" />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1 pr-2 h-9 hover:bg-[#F3F4F6]">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 ring-2 ring-[#EEF2FF]">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-[#4F46E5] text-xs text-white font-semibold">{user?.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left lg:flex">
                <span className="text-[13px] font-medium leading-none text-[#1E293B]">{user?.name ?? "Guest"}</span>
                <span className="text-[10px] text-[#9CA3AF] mt-0.5">{userRole ? roleLabels[userRole] : ""}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#9CA3AF] hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E8EAF0] shadow-lg">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-[#1E293B]">{user?.name ?? "User"}</span>
                  <Badge className="text-[10px] bg-[#EEF2FF] text-[#4F46E5] border-0">
                    {userRole ? roleLabels[userRole] : "Guest"}
                  </Badge>
                </div>
                <span className="text-xs font-normal text-[#9CA3AF]">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E8EAF0]" />
            <DropdownMenuItem asChild>
              <Link href="/pegawai/profil" className="flex items-center w-full text-[#64748B] hover:text-[#1E293B]">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#64748B] hover:text-[#1E293B]">
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#64748B] hover:text-[#1E293B]">
              <HelpCircle className="mr-2 h-4 w-4" />
              Bantuan
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E8EAF0]" />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-[#64748B]">
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E8EAF0]" />
            <DropdownMenuItem className="text-red-500 hover:text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
