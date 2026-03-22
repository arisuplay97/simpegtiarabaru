'use client'
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { ForceChangePasswordModal } from "./force-change-password-modal"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "loading") return
    if (!session && pathname !== "/login") router.push("/login")
    if (session && pathname === "/login") router.push("/")
  }, [session, status, router, pathname])

  if (status === "loading") return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  )

  if (!session && pathname !== "/login") return null

  return (
    <>
      <ForceChangePasswordModal />
      {children}
    </>
  )
}

