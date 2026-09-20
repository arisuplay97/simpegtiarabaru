'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export type ApprovalType = "cuti" | "lembur" | "mutasi" | "kgb" | "pangkat"

export interface UnifiedApprovalItem {
  id: string
  originalId: string
  employeeName: string
  employeeNik: string
  employeeAvatar?: string | null
  employeeInitials: string
  unit: string
  jabatan: string
  type: ApprovalType
  title: string
  badgeLabel?: string
  date: string // e.g. TMT / Tanggal Efektif
  submittedDate: string
  createdAtISO: string
  waitingDays: number
  status: "pending" | "approved" | "rejected"
  priority: "normal" | "urgent" | "overdue"
  description: string
  details: Record<string, any>
  dokumenUrl?: string | null
  slaHours?: number
}

// Fast count for sidebar badge and header status
export async function getPendingApprovalCount(): Promise<number> {
  try {
    const session = await auth()
    if (!session?.user) return 0
    const allowedRoles = ["HRD", "SUPERADMIN", "DIREKSI"]
    if (!allowedRoles.includes(session.user.role ?? "")) return 0

    const [cuti, mutasi, kgb, pangkat] = await Promise.all([
      prisma.cuti.count({ where: { status: "PENDING" } }),
      prisma.mutasi.count({ where: { status: "PENDING" } }),
      prisma.kGB.count({ where: { status: "PENDING" } }),
      prisma.kenaikanPangkat.count({ where: { status: "PENDING" } }),
    ])

    return cuti + mutasi + kgb + pangkat
  } catch (error) {
    console.error("Error getPendingApprovalCount:", error)
    return 0
  }
}

// Aggregation function
export async function getPendingApprovals(): Promise<UnifiedApprovalItem[]> {
  const session = await auth()
  if (!session?.user) return []
  // Hanya HRD, SUPERADMIN, dan DIREKSI yang bisa melihat semua approval
  const allowedRoles = ["HRD", "SUPERADMIN", "DIREKSI"]
  if (!allowedRoles.includes(session.user.role ?? "")) return []

  const items: UnifiedApprovalItem[] = []
  const now = new Date()

  // 1. CUTI
  const pendingCuti = await prisma.cuti.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'desc' }
  })
  pendingCuti.forEach(c => {
    const subDate = new Date(c.createdAt)
    const diffDays = Math.max(0, Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24)))
    let priority: "normal" | "urgent" | "overdue" = "normal"
    if (diffDays >= 7) priority = "overdue"
    else if (diffDays >= 3) priority = "urgent"

    const start = new Date(c.tanggalMulai)
    const end = new Date(c.tanggalSelesai)
    const tglMulai = start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const tglSelesai = end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const daysDuration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    items.push({
      id: `cuti-${c.id}`,
      originalId: c.id,
      employeeName: c.pegawai.nama,
      employeeNik: c.pegawai.nik,
      employeeAvatar: c.pegawai.fotoUrl,
      employeeInitials: (c.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: c.pegawai.bidang?.nama || "Umum",
      jabatan: c.pegawai.jabatan || "Staff",
      type: "cuti",
      title: `Pengajuan ${c.jenisCuti.replace(/_/g, " ")}`,
      badgeLabel: c.jenisCuti.replace(/_/g, " "),
      date: tglMulai === tglSelesai ? tglMulai : `${tglMulai} – ${tglSelesai} (${daysDuration} Hari)`,
      submittedDate: subDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAtISO: c.createdAt.toISOString(),
      waitingDays: diffDays,
      status: "pending",
      priority,
      description: c.alasan || "Pengajuan izin/cuti kepegawaian",
      dokumenUrl: c.dokumenUrl,
      details: {
        "Jenis Izin / Cuti": c.jenisCuti.replace(/_/g, " "),
        "Periode": `${tglMulai} – ${tglSelesai}`,
        "Durasi": `${daysDuration} Hari Kerja`,
        "Sisa Saldo Cuti": `${c.pegawai.saldoCuti} Hari`,
        "Surat / Dokumen Bukti": c.dokumenUrl ? "Tersedia (Klik lihat pada lampiran)" : "Tidak dilampirkan"
      }
    })
  })

  // 2. MUTASI
  const pendingMutasi = await prisma.mutasi.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'desc' }
  })
  pendingMutasi.forEach(m => {
    const subDate = new Date(m.createdAt)
    const diffDays = Math.max(0, Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24)))
    let priority: "normal" | "urgent" | "overdue" = "normal"
    if (diffDays >= 7) priority = "overdue"
    else if (diffDays >= 3) priority = "urgent"

    const tmtDate = new Date(m.tanggalEfektif).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

    items.push({
      id: `mutasi-${m.id}`,
      originalId: m.id,
      employeeName: m.pegawai.nama,
      employeeNik: m.pegawai.nik,
      employeeAvatar: m.pegawai.fotoUrl,
      employeeInitials: (m.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: m.unitAsal || m.pegawai.bidang?.nama || "Sekretariat Perusahaan",
      jabatan: m.jabatanAsal || m.pegawai.jabatan || "Staff",
      type: "mutasi",
      title: `Pengajuan Mutasi / Rotasi Jabatan`,
      badgeLabel: m.type || "MUTASI",
      date: `TMT: ${tmtDate}`,
      submittedDate: subDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAtISO: m.createdAt.toISOString(),
      waitingDays: diffDays,
      status: "pending",
      priority,
      description: m.alasan || "Pengajuan mutasi / perpindahan unit penugasan",
      details: {
        "Tipe Mutasi": m.type,
        "Unit Kerja Asal": m.unitAsal || "-",
        "Jabatan Asal": m.jabatanAsal || "-",
        "Unit Kerja Tujuan": m.unitTujuan || "-",
        "Jabatan Baru": m.jabatanTujuan || "-",
        "TMT Efektif": tmtDate
      }
    })
  })

  // 3. KGB (Kenaikan Gaji Berkala)
  const pendingKGB = await prisma.kGB.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'desc' }
  })
  pendingKGB.forEach(k => {
    const subDate = new Date(k.createdAt)
    const diffDays = Math.max(0, Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24)))
    let priority: "normal" | "urgent" | "overdue" = "normal"
    if (diffDays >= 7) priority = "overdue"
    else if (diffDays >= 3) priority = "urgent"

    const tmtDate = new Date(k.tanggalBerlaku).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

    items.push({
      id: `kgb-${k.id}`,
      originalId: k.id,
      employeeName: k.pegawai.nama,
      employeeNik: k.pegawai.nik,
      employeeAvatar: k.pegawai.fotoUrl,
      employeeInitials: (k.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: k.pegawai.bidang?.nama || "Umum",
      jabatan: k.pegawai.jabatan,
      type: "kgb",
      title: "Kenaikan Gaji Berkala (KGB)",
      badgeLabel: "KGB",
      date: `TMT: ${tmtDate}`,
      submittedDate: subDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAtISO: k.createdAt.toISOString(),
      waitingDays: diffDays,
      status: "pending",
      priority,
      description: k.keterangan || "Pengajuan penyesuaian kenaikan gaji berkala",
      details: {
        "Gaji Pokok Lama": `Rp ${Number(k.gajiPokokLama).toLocaleString('id-ID')}`,
        "Gaji Pokok Baru": `Rp ${Number(k.gajiPokokBaru).toLocaleString('id-ID')}`,
        "Tanggal Berlaku": tmtDate
      }
    })
  })

  // 4. KENAIKAN PANGKAT
  const pendingPangkat = await prisma.kenaikanPangkat.findMany({
    where: { status: "PENDING" },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: 'desc' }
  })
  pendingPangkat.forEach(p => {
    const subDate = new Date(p.createdAt)
    const diffDays = Math.max(0, Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24)))
    let priority: "normal" | "urgent" | "overdue" = "normal"
    if (diffDays >= 7) priority = "overdue"
    else if (diffDays >= 3) priority = "urgent"

    const tmtDate = new Date(p.tanggalBerlaku).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

    items.push({
      id: `pangkat-${p.id}`,
      originalId: p.id,
      employeeName: p.pegawai.nama,
      employeeNik: p.pegawai.nik,
      employeeAvatar: p.pegawai.fotoUrl,
      employeeInitials: (p.pegawai.nama || "U").substring(0, 2).toUpperCase(),
      unit: p.pegawai.bidang?.nama || "Umum",
      jabatan: p.pegawai.jabatan,
      type: "pangkat",
      title: "Kenaikan Pangkat Reguler",
      badgeLabel: "PANGKAT",
      date: `TMT: ${tmtDate}`,
      submittedDate: subDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAtISO: p.createdAt.toISOString(),
      waitingDays: diffDays,
      status: "pending",
      priority,
      description: p.keterangan || "Pengajuan penyesuaian jenjang kepangkatan/golongan",
      details: {
        "Pangkat / Golongan Lama": `${p.pangkatLama || "-"} (${p.golonganLama || "-"})`,
        "Pangkat / Golongan Baru": `${p.pangkatBaru || "-"} (${p.golonganBaru || "-"})`,
        "Tanggal Berlaku": tmtDate
      }
    })
  })

  // Urutkan: overdue / urgent di atas, lalu berdasarkan tanggal pengajuan terbaru
  items.sort((a, b) => {
    if (a.priority === "overdue" && b.priority !== "overdue") return -1
    if (b.priority === "overdue" && a.priority !== "overdue") return 1
    if (a.priority === "urgent" && b.priority !== "urgent") return -1
    if (b.priority === "urgent" && a.priority !== "urgent") return 1
    return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
  })

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
    // SECURITY: Hanya peran yang berwenang yang boleh approve/reject
    const session = await auth()
    if (!session?.user) return { error: "Anda belum login." }
    const allowedRoles = ["HRD", "SUPERADMIN", "DIREKSI"]
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return { error: "Akses ditolak. Hanya HRD, Superadmin, atau Direksi yang dapat memproses persetujuan." }
    }

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
          const isWeekend = day === 0 || day === 6
          if (!isWeekend) {
            workingDays++
            // FIXED: Ganti logika upsert berbahaya dengan findFirst + create/update
            const startOfDay = new Date(current)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(current)
            endOfDay.setHours(23, 59, 59, 999)

            const absensiExist = await prisma.absensi.findFirst({
              where: {
                pegawaiId: cuti.pegawaiId,
                tanggal: { gte: startOfDay, lte: endOfDay }
              }
            })

            if (absensiExist) {
              await prisma.absensi.update({ where: { id: absensiExist.id }, data: { status: "CUTI" } })
            } else {
              await prisma.absensi.create({
                data: { pegawaiId: cuti.pegawaiId, tanggal: new Date(current), status: "CUTI" }
              })
            }
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

