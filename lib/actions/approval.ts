'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ApprovalType = "cuti" | "lembur" | "mutasi" | "kgb" | "pangkat"

export interface UnifiedApprovalItem {
  id: string
  originalId: string
  employeeName: string
  employeeNik: string
  employeeInitials: string
  unit: string
  jabatan: string
  type: ApprovalType
  title: string
  date: string // e.g. TMT / Tanggal Efektif
  submittedDate: string
  status: "pending" | "approved" | "rejected"
  priority: "normal" | "urgent" | "overdue"
  description: string
  details: Record<string, any>
  slaHours?: number
}

// Aggregation function
export async function getPendingApprovals(): Promise<UnifiedApprovalItem[]> {
  const items: UnifiedApprovalItem[] = []

  // 1. CUTI
  const pendingCuti = await prisma.cuti.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'asc' }
  })
  pendingCuti.forEach(c => {
    items.push({
      id: `cuti-${c.id}`,
      originalId: c.id,
      employeeName: c.pegawai.nama,
      employeeNik: c.pegawai.nik,
      employeeInitials: (c.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: c.pegawai.bidang?.nama || "Umum",
      jabatan: c.pegawai.jabatan,
      type: "cuti",
      title: `Pengajuan ${c.jenisCuti.replace(/_/g, " ")}`,
      date: `${c.tanggalMulai.toISOString().split('T')[0]} - ${c.tanggalSelesai.toISOString().split('T')[0]}`,
      submittedDate: c.createdAt.toISOString().split('T')[0],
      status: "pending",
      priority: "normal",
      description: c.alasan || "Pengajuan Cuti",
      details: {
        "Sisa Cuti": `${c.pegawai.saldoCuti} Hari`,
        "Tipe": c.jenisCuti,
      }
    })
  })

  // 2. MUTASI
  const pendingMutasi = await prisma.mutasi.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'asc' }
  })
  pendingMutasi.forEach(m => {
    items.push({
      id: `mutasi-${m.id}`,
      originalId: m.id,
      employeeName: m.pegawai.nama,
      employeeNik: m.pegawai.nik,
      employeeInitials: (m.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: m.unitAsal,
      jabatan: m.jabatanAsal,
      type: "mutasi",
      title: `Pengajuan ${m.type}`,
      date: `TMT: ${m.tanggalEfektif.toISOString().split('T')[0]}`,
      submittedDate: m.createdAt.toISOString().split('T')[0],
      status: "pending",
      priority: "urgent",
      description: m.alasan || "Pengajuan pemindahan tugas/karir",
      details: {
        "Unit Tujuan": m.unitTujuan,
        "Jabatan Tujuan": m.jabatanTujuan,
        "Jenis": m.type
      }
    })
  })

  // 3. KGB (Kenaikan Gaji Berkala)
  const pendingKGB = await prisma.kGB.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'asc' }
  })
  pendingKGB.forEach(k => {
    items.push({
      id: `kgb-${k.id}`,
      originalId: k.id,
      employeeName: k.pegawai.nama,
      employeeNik: k.pegawai.nik,
      employeeInitials: (k.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: k.pegawai.bidang?.nama || "Umum",
      jabatan: k.pegawai.jabatan,
      type: "kgb",
      title: "Kenaikan Gaji Berkala",
      date: `TMT: ${k.tanggalBerlaku.toISOString().split('T')[0]}`,
      submittedDate: k.createdAt.toISOString().split('T')[0],
      status: "pending",
      priority: "normal",
      description: k.keterangan || "Pengajuan KGB Reguler",
      details: {
        "Gaji Lama": `Rp ${Number(k.gajiPokokLama).toLocaleString('id-ID')}`,
        "Gaji Baru": `Rp ${Number(k.gajiPokokBaru).toLocaleString('id-ID')}`
      }
    })
  })

  // 4. KENAIKAN PANGKAT
  const pendingPangkat = await prisma.kenaikanPangkat.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'asc' }
  })
  pendingPangkat.forEach(p => {
    items.push({
      id: `pangkat-${p.id}`,
      originalId: p.id,
      employeeName: p.pegawai.nama,
      employeeNik: p.pegawai.nik,
      employeeInitials: (p.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: p.pegawai.bidang?.nama || "Umum",
      jabatan: p.pegawai.jabatan,
      type: "pangkat",
      title: "Kenaikan Pangkat Reguler",
      date: `TMT: ${p.tanggalBerlaku.toISOString().split('T')[0]}`,
      submittedDate: p.createdAt.toISOString().split('T')[0],
      status: "pending",
      priority: "urgent",
      description: p.keterangan || "Pengajuan penyesuaian/kenaikan jenjang pangkat",
      details: {
        "Golongan Lama": `${p.pangkatLama} - ${p.golonganLama}`,
        "Golongan Baru": `${p.pangkatBaru} - ${p.golonganBaru}`
      }
    })
  })

  // Calculate SLA/Priority based on days pending
  const now = new Date()
  items.forEach(item => {
    const subDate = new Date(item.submittedDate)
    const diffDays = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 3) item.priority = "urgent"
    if (diffDays > 7) item.priority = "overdue"
  })

  // Sort by created at
  items.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime())

  return items
}

export async function processUnifiedApproval(
  type: ApprovalType,
  originalId: string,
  isApprove: boolean,
  approverId: string,
  catatan?: string
) {
  try {
    const status = isApprove ? "APPROVED" : "REJECTED"

    if (type === "cuti") {
      if (isApprove) {
        // Ambil data cuti lengkap
        const cuti = await prisma.cuti.findUnique({
          where: { id: originalId },
          include: { pegawai: true }
        })

        if (!cuti) throw new Error("Data cuti tidak ditemukan")

        await prisma.cuti.update({ where: { id: originalId }, data: { status: "APPROVED" } })

        // Isi absensi CUTI untuk setiap hari di periode cuti (termasuk weekend → opsional skip)
        const start = new Date(cuti.tanggalMulai)
        const end = new Date(cuti.tanggalSelesai)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)

        let workingDays = 0
        const current = new Date(start)
        while (current <= end) {
          const day = current.getDay()
          const isWeekend = day === 0 || day === 6 // Minggu = 0, Sabtu = 6
          if (!isWeekend) {
            workingDays++
            // Upsert: kalau sudah ada record absensi di hari itu, update saja
            await prisma.absensi.upsert({
              where: {
                // Gunakan composite by manual search karena tidak ada unique constraint on (pegawaiId, tanggal)
                // fallback: crate jika belum ada, update jika sudah ada
                id: (await prisma.absensi.findFirst({
                  where: {
                    pegawaiId: cuti.pegawaiId,
                    tanggal: {
                      gte: new Date(current.setHours(0, 0, 0, 0)),
                      lte: new Date(current.setHours(23, 59, 59, 999))
                    }
                  },
                  select: { id: true }
                }))?.id || "new-placeholder-will-fail",
              },
              update: { status: "CUTI" },
              create: {
                pegawaiId: cuti.pegawaiId,
                tanggal: new Date(current),
                status: "CUTI"
              }
            }).catch(async () => {
              // Jika upsert gagal (ID placeholder tidak valid), create baru
              const tanggalHari = new Date(current)
              const exists = await prisma.absensi.findFirst({
                where: {
                  pegawaiId: cuti.pegawaiId,
                  tanggal: { gte: new Date(tanggalHari.setHours(0,0,0,0)), lte: new Date(tanggalHari.setHours(23,59,59,999)) }
                }
              })
              if (exists) {
                await prisma.absensi.update({ where: { id: exists.id }, data: { status: "CUTI" } })
              } else {
                await prisma.absensi.create({
                  data: { pegawaiId: cuti.pegawaiId, tanggal: new Date(current), status: "CUTI" }
                })
              }
            })
          }
          current.setDate(current.getDate() + 1)
          current.setHours(0, 0, 0, 0)
        }

        // Kurangi saldo cuti pegawai
        if (workingDays > 0) {
          await prisma.pegawai.update({
            where: { id: cuti.pegawaiId },
            data: { saldoCuti: { decrement: workingDays } }
          })
        }

        // Kirim notifikasi ke pegawai
        try {
          if (cuti.pegawai.userId) {
            await prisma.notifikasi.create({
              data: {
                userId: cuti.pegawai.userId,
                title: "Cuti Anda Disetujui ✅",
                message: `Permohonan cuti ${cuti.jenisCuti.replace(/_/g, " ")} selama ${workingDays} hari kerja telah disetujui. Absensi Anda otomatis tercatat sebagai CUTI.`,
                link: "/cuti"
              }
            })
          }
        } catch (_) {}

        revalidatePath("/absensi")
        revalidatePath("/cuti")
      } else {
        // Rejected — hanya update status cuti, tidak perlu sentuh absensi
        await prisma.cuti.update({ where: { id: originalId }, data: { status: "REJECTED" } })

        // Notifikasi penolakan ke pegawai
        try {
          const cuti = await prisma.cuti.findUnique({
            where: { id: originalId },
            include: { pegawai: true }
          })
          if (cuti?.pegawai.userId) {
            await prisma.notifikasi.create({
              data: {
                userId: cuti.pegawai.userId,
                title: "Cuti Anda Ditolak ❌",
                message: `Permohonan cuti ${cuti.jenisCuti.replace(/_/g, " ")} Anda telah ditolak.`,
                link: "/cuti"
              }
            })
          }
        } catch (_) {}
      }

    } else if (type === "mutasi") {
      // Import from mutasi module logic to safely handle unit assignments
      const { processMutasi } = await import("@/lib/actions/mutasi")
      await processMutasi(originalId, isApprove, approverId, catatan)
    } else if (type === "kgb") {
      const { updateStatusKGB } = await import("@/lib/actions/kgb")
      await updateStatusKGB(originalId, isApprove)
    } else if (type === "pangkat") {
      const { updateStatusPangkat } = await import("@/lib/actions/pangkat")
      await updateStatusPangkat(originalId, isApprove)
    }

    revalidatePath("/approval")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses persetujuan" }
  }
}

