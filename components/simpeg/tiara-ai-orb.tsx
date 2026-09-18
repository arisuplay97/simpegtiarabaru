"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import animationData from "@/public/animations/tiara-assistant.json"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface TiaraAiOrbProps {
  className?: string
  loop?: boolean
}

export function TiaraAiOrb({ className = "w-full h-full", loop = true }: TiaraAiOrbProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-16 h-16 rounded-full bg-blue-400/20 blur-md animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop={loop}
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_24px_rgba(59,130,246,0.35)]"
      />
    </div>
  )
}
