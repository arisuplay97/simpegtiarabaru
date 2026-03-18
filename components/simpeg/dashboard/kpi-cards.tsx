"use client"
import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  UserCheck,
  ClipboardCheck,
  Clock,
  Wallet,
  UserMinus,
  FileText,
  Plane,
  AlertTriangle,
  Star,
  TrendingUp,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: KPICardProps) {
  const iconBgColors = {
    default: "bg-secondary",
    primary: "bg-primary/10",
    success: "bg-emerald-50",
    warning: "bg-amber-50",
    danger: "bg-red-50",
  }

  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }

  return (
    <div className="card-premium group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {trend && (
            <div className="mt-1 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs bulan lalu</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconBgColors[variant]
          )}
        >
          <Icon className={cn("h-6 w-6", iconColors[variant])} />
        </div>
      </div>
      {/* Decorative gradient */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

export function KPICards() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="grid h-32 w-full grid-cols-6 gap-4 animate-pulse bg-muted rounded-xl" />

  const primaryKPIs = [
    {
      title: "Total Pegawai",
      value: "1,247",
      subtitle: "Aktif di sistem",
      icon: Users,
      variant: "primary" as const,
      trend: { value: 2.5, isPositive: true },
    },
    {
      title: "Pegawai Aktif",
      value: "1,198",
      subtitle: "96% dari total",
      icon: UserCheck,
      variant: "success" as const,
      trend: { value: 1.2, isPositive: true },
    },
    {
      title: "Approval Pending",
      value: "47",
      subtitle: "Butuh tindakan",
      icon: ClipboardCheck,
      variant: "warning" as const,
    },
    {
      title: "Kehadiran Hari Ini",
      value: "1,156",
      subtitle: "97% hadir",
      icon: Clock,
      variant: "success" as const,
      trend: { value: 0.8, isPositive: true },
    },
    {
      title: "Payroll Bulan Ini",
      value: "Rp 4.2M",
      subtitle: `Periode ${format(new Date(), "MMMM yyyy", { locale: id })}`,
      icon: Wallet,
      variant: "primary" as const,
      trend: { value: 3.1, isPositive: false },
    },
    {
      title: "Mendekati Pensiun",
      value: "23",
      subtitle: "Dalam 6 bulan",
      icon: UserMinus,
      variant: "danger" as const,
    },
  ]

  const secondaryKPIs = [
    {
      title: "Kontrak Akan Habis",
      value: "18",
      subtitle: "30 hari ke depan",
      icon: FileText,
      variant: "warning" as const,
    },
    {
      title: "Cuti Hari Ini",
      value: "42",
      subtitle: "3.4% pegawai",
      icon: Plane,
      variant: "default" as const,
    },
    {
      title: "Dokumen Kadaluarsa",
      value: "7",
      subtitle: "Perlu diperbarui",
      icon: AlertTriangle,
      variant: "danger" as const,
    },
    {
      title: "Eligible Naik Pangkat",
      value: "89",
      subtitle: "Sudah memenuhi syarat",
      icon: Star,
      variant: "success" as const,
    },
    {
      title: "Eligible Naik Gaji",
      value: "156",
      subtitle: "KGB periode ini",
      icon: TrendingUp,
      variant: "primary" as const,
    },
    {
      title: "Training Aktif",
      value: "12",
      subtitle: "Sedang berlangsung",
      icon: GraduationCap,
      variant: "default" as const,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {primaryKPIs.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>
      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {secondaryKPIs.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>
    </div>
  )
}
