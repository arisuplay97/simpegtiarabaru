"use client"

import React from "react"
import Image from "next/image"
import { ShieldCheck, UserCog, Briefcase, User } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import type { AppRole } from "@/lib/auth/types"

const cards: Array<{ role: AppRole; title: string; subtitle: string; icon: React.ReactNode }> = [
  {
    role: "super_admin",
    title: "Masuk sebagai Super Admin",
    subtitle: "Akses penuh seluruh modul aktif",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    role: "hrd",
    title: "Masuk sebagai HRD",
    subtitle: "Kelola approval, pegawai, payroll, dan SP",
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    role: "direktur",
    title: "Masuk sebagai Direktur",
    subtitle: "Approval strategis dan dashboard direksi",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    role: "pegawai",
    title: "Masuk sebagai Pegawai",
    subtitle: "Absensi, cuti, slip gaji, dan dokumen pribadi",
    icon: <User className="h-5 w-5" />,
  },
]

export default function LoginPage() {
  const { loginAs } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid min-h-[640px] md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden md:block">
            <Image src="/login-bg.png" alt="SIMPEG" fill className="object-cover" />
            <div className="absolute inset-0 bg-[#0f3b6e]/70" />
            <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">SP</div>
                <h1 className="max-w-md text-4xl font-bold leading-tight">SIMPEG PDAM Enterprise Human Capital Suite</h1>
                <p className="mt-4 max-w-md text-sm text-white/80">
                  Demo login berbasis role untuk Super Admin, HRD, Direktur, dan Pegawai.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm font-semibold">Yang tersedia dalam patch ini</div>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  <li>• Role-based sidebar & access control</li>
                  <li>• User Management</li>
                  <li>• Modul SP / Surat Peringatan</li>
                  <li>• Approval flow bertahap (frontend demo)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center md:text-left">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f3b6e] text-lg font-bold text-white md:mx-0">SP</div>
                <h2 className="text-3xl font-bold text-slate-900">Pilih Role Demo</h2>
                <p className="mt-2 text-sm text-slate-500">Masuk cepat untuk menguji akses, approval, dan pembatasan menu.</p>
              </div>

              <div className="space-y-3">
                {cards.map((card) => (
                  <button
                    key={card.role}
                    onClick={() => loginAs(card.role)}
                    className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#0f3b6e] hover:bg-slate-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f2fb] text-[#0f3b6e]">
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{card.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{card.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
