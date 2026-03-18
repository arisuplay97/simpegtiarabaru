"use client"

import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  Building2,
  Briefcase,
  ChevronDown,
} from "lucide-react"

interface OrgNode {
  id: string
  name: string
  jabatan: string
  unit: string
  initials: string
  level: number
  children?: OrgNode[]
}

const organizationData: OrgNode = {
  id: "1",
  name: "Ir. Joko Widodo",
  jabatan: "Direktur Utama",
  unit: "Direksi",
  initials: "JW",
  level: 1,
  children: [
    {
      id: "2",
      name: "Bambang Susanto, SE, MM",
      jabatan: "Direktur Umum & SDM",
      unit: "Direksi",
      initials: "BS",
      level: 2,
      children: [
        {
          id: "5",
          name: "Fitri Handayani",
          jabatan: "Ka. Bagian SDM",
          unit: "SDM & Umum",
          initials: "FH",
          level: 3,
          children: [
            { id: "10", name: "Rina Susanti", jabatan: "Staff SDM", unit: "SDM & Umum", initials: "RS", level: 4 },
            { id: "11", name: "Agus Setiawan", jabatan: "Staff Umum", unit: "SDM & Umum", initials: "AS", level: 4 },
          ],
        },
        {
          id: "6",
          name: "Ahmad Rizki Pratama",
          jabatan: "Ka. Bagian IT",
          unit: "IT & Sistem",
          initials: "AR",
          level: 3,
          children: [
            { id: "12", name: "Rudi Hartono", jabatan: "System Analyst", unit: "IT & Sistem", initials: "RH", level: 4 },
            { id: "13", name: "Diana Putri", jabatan: "Programmer", unit: "IT & Sistem", initials: "DP", level: 4 },
          ],
        },
      ],
    },
    {
      id: "3",
      name: "Dr. Siti Rahayu, MT",
      jabatan: "Direktur Teknik",
      unit: "Direksi",
      initials: "SR",
      level: 2,
      children: [
        {
          id: "7",
          name: "Gunawan Wibowo",
          jabatan: "Manager Produksi",
          unit: "Produksi",
          initials: "GW",
          level: 3,
          children: [
            { id: "14", name: "Eko Prasetyo", jabatan: "Operator IPA", unit: "Produksi", initials: "EP", level: 4 },
            { id: "15", name: "Hendra Kusuma", jabatan: "Teknisi", unit: "Produksi", initials: "HK", level: 4 },
          ],
        },
        {
          id: "8",
          name: "Budi Santoso",
          jabatan: "Manager Distribusi",
          unit: "Distribusi",
          initials: "BS",
          level: 3,
          children: [
            { id: "16", name: "Dedi Kurniawan", jabatan: "Supervisor Distribusi", unit: "Distribusi", initials: "DK", level: 4 },
          ],
        },
      ],
    },
    {
      id: "4",
      name: "Drs. Andi Wijaya, MM",
      jabatan: "Direktur Keuangan",
      unit: "Direksi",
      initials: "AW",
      level: 2,
      children: [
        {
          id: "9",
          name: "Siti Nurhaliza",
          jabatan: "Ka. Bagian Keuangan",
          unit: "Keuangan",
          initials: "SN",
          level: 3,
          children: [
            { id: "17", name: "Yuni Astuti", jabatan: "Staff Akuntansi", unit: "Keuangan", initials: "YA", level: 4 },
            { id: "18", name: "Dewi Lestari", jabatan: "Staff Pelayanan", unit: "Pelayanan", initials: "DL", level: 4 },
          ],
        },
      ],
    },
  ],
}

const stats = [
  { label: "Total Pegawai", value: "1,247", icon: Users },
  { label: "Unit Kerja", value: "12", icon: Building2 },
  { label: "Jabatan", value: "45", icon: Briefcase },
]

function OrgNodeCard({ node, isRoot = false }: { node: OrgNode; isRoot?: boolean }) {
  const levelColors: Record<number, string> = {
    1: "border-primary bg-primary/5",
    2: "border-blue-500 bg-blue-50",
    3: "border-emerald-500 bg-emerald-50",
    4: "border-amber-500 bg-amber-50",
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-xl border-2 p-4 text-center transition-all hover:shadow-lg ${
          levelColors[node.level] || "border-border"
        }`}
        style={{ minWidth: "180px" }}
      >
        <Avatar className="mx-auto mb-2 h-12 w-12">
          <AvatarFallback
            className={
              node.level === 1
                ? "bg-primary text-primary-foreground"
                : node.level === 2
                ? "bg-blue-500 text-white"
                : node.level === 3
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            }
          >
            {node.initials}
          </AvatarFallback>
        </Avatar>
        <h4 className="text-sm font-semibold text-foreground">{node.name}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{node.jabatan}</p>
        <Badge
          variant="outline"
          className="mt-2 text-[10px]"
        >
          {node.unit}
        </Badge>
      </div>

      {node.children && node.children.length > 0 && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="relative flex justify-center">
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: "50%",
                  right: "50%",
                  marginLeft: `-${(node.children.length - 1) * 100}px`,
                  marginRight: `-${(node.children.length - 1) * 100}px`,
                  width: `${(node.children.length - 1) * 200}px`,
                }}
              />
            )}
            <div className="flex gap-8">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {node.children && node.children.length > 1 && (
                    <div className="h-6 w-px bg-border" />
                  )}
                  <OrgNodeCard node={child} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function OrganisasiPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kepegawaian", "Struktur Organisasi"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Struktur Organisasi</h1>
              <p className="text-sm text-muted-foreground">
                PDAM Tirta Ardhia Rinjani - Tahun 2026
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" size="icon">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="card-premium">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legend */}
          <Card className="card-premium mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-6">
                <span className="text-sm font-medium">Keterangan Level:</span>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">Direksi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Direktur</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Manager/Ka. Bagian</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Staff</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Chart */}
          <Card className="card-premium">
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <div className="flex min-w-max justify-center py-4">
                  <OrgNodeCard node={organizationData} isRoot />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
