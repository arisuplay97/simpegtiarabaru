"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import animationData from "@/public/animations/verified-badge.json"
import { cn } from "@/lib/utils"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface VerifiedBadgeProps {
  className?: string
  title?: string
}

export function VerifiedBadge({
  className = "w-4 h-4",
  title = "Super Admin Terverifikasi",
}: VerifiedBadgeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        title={title}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-blue-500/30" />
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}
      title={title}
      aria-label={title}
    >
      <Lottie
        animationData={animationData}
        loop={true}
        style={{ width: "100%", height: "100%" }}
        className="w-full h-full object-contain pointer-events-none"
      />
    </span>
  )
}
