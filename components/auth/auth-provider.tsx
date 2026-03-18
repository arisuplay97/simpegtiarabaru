"use client"

import React from "react"
import { useRouter } from "next/navigation"
import type { AppRole, DemoUser } from "@/lib/auth/types"
import { roleLabels, hasPermission } from "@/lib/auth/permissions"

interface AuthContextValue {
  user: DemoUser | null
  role: AppRole | null
  isAuthenticated: boolean
  loginAs: (role: AppRole) => void
  logout: () => void
  can: (permission: Parameters<typeof hasPermission>[1]) => boolean
}

const demoUsers: Record<AppRole, DemoUser> = {
  super_admin: {
    id: "u1",
    name: "Dwiky Firmansyah",
    email: "dwikyfirman@gmail.com",
    nik: "5271011209900001",
    role: "super_admin",
    unit: "Sekretariat Direksi",
    status: "active",
    lastLogin: "Hari ini, 08:12",
  },
  hrd: {
    id: "u2",
    name: "Mba Yuen",
    email: "hrd@tirtaardhia.co.id",
    nik: "5271011209900002",
    role: "hrd",
    unit: "Human Capital",
    status: "active",
    lastLogin: "Hari ini, 07:44",
  },
  direktur: {
    id: "u3",
    name: "H. Doni Alga, S.E., M.M.",
    email: "direktur@tirtaardhia.co.id",
    nik: "5271011209900003",
    role: "direktur",
    unit: "Direksi",
    status: "active",
    lastLogin: "Hari ini, 06:58",
  },
  pegawai: {
    id: "u4",
    name: "Ir. Ahmad Suryadi",
    email: "pegawai@tirtaardhia.co.id",
    nik: "5271011209900004",
    role: "pegawai",
    unit: "Cabang Praya",
    status: "active",
    lastLogin: "Kemarin, 16:22",
  },
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = "simpeg-demo-role"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [role, setRole] = React.useState<AppRole | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY) as AppRole | null
    if (stored && demoUsers[stored]) setRole(stored)
  }, [])

  const loginAs = React.useCallback((nextRole: AppRole) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextRole)
    }
    setRole(nextRole)
    router.push(nextRole === "direktur" ? "/dashboard/direksi" : "/")
  }, [router])

  const logout = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setRole(null)
    router.push("/login")
  }, [router])

  const value = React.useMemo<AuthContextValue>(() => ({
    user: role ? demoUsers[role] : null,
    role,
    isAuthenticated: Boolean(role),
    loginAs,
    logout,
    can: (permission) => (role ? hasPermission(role, permission) : false),
  }), [role, loginAs, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export { demoUsers, roleLabels }
