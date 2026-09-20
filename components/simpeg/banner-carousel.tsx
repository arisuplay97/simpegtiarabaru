"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface BannerCarouselItem {
  id: string
  judul?: string | null
  imageUrl: string
  tampilkanSampai?: string | Date | null
}

interface BannerCarouselProps {
  banners: BannerCarouselItem[]
  autoSlideInterval?: number // default 4000ms
  className?: string
  aspectRatioClass?: string // default: "aspect-[16/7]"
  showControls?: boolean
}

export function BannerCarousel({
  banners,
  autoSlideInterval = 4000,
  className = "",
  aspectRatioClass = "aspect-[16/7]",
  showControls = true,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Safely determine items — hooks MUST run before any early return
  const items = banners && banners.length > 0 ? banners : []
  const hasMultiple = items.length > 1
  const isEmpty = items.length === 0

  const nextSlide = useCallback(() => {
    if (items.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const prevSlide = useCallback(() => {
    if (items.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  // Auto-slide effect jika gambar lebih dari 1
  useEffect(() => {
    if (!hasMultiple || isPaused) return

    const timer = setInterval(() => {
      nextSlide()
    }, autoSlideInterval)

    return () => clearInterval(timer)
  }, [hasMultiple, isPaused, autoSlideInterval, nextSlide])

  // Reset currentIndex jika items berubah dan index di luar jangkauan
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(0)
    }
  }, [items.length, currentIndex])

  // Jika tidak ada banner, jangan tampilkan apa pun (SETELAH semua hooks)
  if (isEmpty) return null

  // Touch handlers untuk swipe di mobile HP
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    setIsPaused(false)
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const isSwipe = Math.abs(distance) > 40

    if (isSwipe) {
      if (distance > 0) {
        // Geser ke kiri -> next
        nextSlide()
      } else {
        // Geser ke kanan -> prev
        prevSlide()
      }
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900 select-none group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container Carousel Slides */}
      <div
        className="flex transition-transform duration-500 ease-out w-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className={`relative w-full shrink-0 ${aspectRatioClass} overflow-hidden bg-zinc-100 dark:bg-zinc-800`}
          >
            <Image
              src={item.imageUrl.startsWith("http") || item.imageUrl.startsWith("/") || item.imageUrl.startsWith("data:") ? item.imageUrl : `/${item.imageUrl}`}
              alt={item.judul || `Banner ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
            {/* Optional subtle gradient overlay for title */}
            {item.judul && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2.5 pt-6 flex items-end">
                <span className="text-[11px] font-medium text-white line-clamp-1 drop-shadow-xs">
                  {item.judul}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigasi Panah Kiri & Kanan (Hanya jika > 1 dan showControls true) */}
      {hasMultiple && showControls && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prevSlide()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 md:opacity-0 transition-opacity duration-200 focus:outline-hidden"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              nextSlide()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 md:opacity-0 transition-opacity duration-200 focus:outline-hidden"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Indikator Titik (Dots) di Bawah */}
      {hasMultiple && (
        <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10">
          {items.map((_, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? "w-5 h-1.5 bg-white shadow-xs"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ke slide ${idx + 1}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
