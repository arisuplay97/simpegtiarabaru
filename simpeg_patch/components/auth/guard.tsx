"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { routeAccess, hasPermission } from "@/lib/auth/permissions"
import { useAuth } from "./auth-provider"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, isAuthenticated } = useAuth()

  React.useEffect(() => {
    if (pathname === "/login") return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (!role) return
    const permission = routeAccess(pathname)
    if (permission && !hasPermission(role, permission)) {
      router.replace("/forbidden")
    }
  }, [pathname, router, isAuthenticated, role])

  return <>{children}</>
}
