'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ─── Helpers ───────────────────────────────────────────────────────
const ALLOWED_ROLES = ['SUPERADMIN', 'HRD', 'KEPALA_BIDANG', 'KEPALA_CABANG'] as const

function hitungSkorAtasan(data: {
  disiplinKerja: number
  tanggungjawab: number
  kualitasKerja: number
  sikapKerja: number
  inisiatif: number
  kepatuhan: number
}): number {
  // Rata-rata 6 komponen (1–5), kemudian normalisasi ke 0–100
  const avg = (
    data.disiplinKerja +
    data.tanggungjawab +
    data.kualitasKerja +
    data.sikapKerja +
    data.inisiatif +
    data.kepatuhan
  ) / 6
  return Math.round(((avg - 1) / 4) * 100 * 10) / 10
}

// ─── GET: Daftar pegawai yang bisa dinilai ──────────────────────────
export async function getPenilaianList(bulan?: number, tahun?: number) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id

    if (!userId || !ALLOWED_ROLES.includes(role)) return { error: "Akses ditolak" }

    const now = new Date()
    const b = bulan ?? now.getMonth() + 1
    const t = tahun ?? now.getFullYear()

    // Penilai harus punya profil Pegawai (agar kita tahu bidangnya)
    const penilai = await prisma.pegawai.findUnique({
      where: { userId },
      select: { id: true, bidangId: true, tipeJabatan: true }
    })

    // Build filter berdasarkan role
    let whereFilter: any = { status: 'AKTIF' }
    if (role === 'KEPALA_BIDANG' && penilai?.bidangId) {
      whereFilter.bidangId = penilai.bidangId
    } else if (role === 'KEPALA_CABANG' && penilai?.bidangId) {
      whereFilter.bidangId = penilai.bidangId
    }
    // SUPERADMIN & HRD bisa melihat semua

    const pegawaiList = await prisma.pegawai.findMany({
      where: whereFilter,
      select: {
        id: true,
        nama: true,
        jabatan: true,
        fotoUrl: true,
        bidang: { select: { nama: true } },
        indeksPegawai: {
          where: { bulan: b, tahun: t },
          select: {
            id: true,
            totalSkor: true,
            predikat: true,
            skorAtasan: true,
            skorAkhirBlended: true,
            penilaianAtasan: {
              where: { penilaiId: penilai?.id ?? '' },
              select: { id: true, status: true, skorAtasan: true }
            }
          }
        }
      },
      orderBy: { nama: 'asc' }
    })

    return {
      success: true,
      penilaiId: penilai?.id,
      bulan: b,
      tahun: t,
      data: pegawaiList.map(p => {
        const indeks = p.indeksPegawai[0] ?? null
        const penilaian = indeks?.penilaianAtasan[0] ?? null
        return {
          pegawaiId: p.id,
          nama: p.nama,
          jabatan: p.jabatan,
          fotoUrl: p.fotoUrl,
          unit: p.bidang?.nama ?? '—',
          skorSistem: indeks?.totalSkor ?? null,
          predikatSistem: indeks?.predikat ?? null,
          skorAtasan: penilaian?.skorAtasan ?? null,
          skorAkhirBlended: indeks?.skorAkhirBlended ?? null,
          statusPenilaian: penilaian?.status ?? null,
          penilaianId: penilaian?.id ?? null,
          indeksPegawaiId: indeks?.id ?? null,
        }
      })
    }
  } catch (error: any) {
    console.error('getPenilaianList error:', error)
    return { error: error.message }
  }
}

// ─── GET: Detail pegawai + snapshot sistem ─────────────────────────
export async function getPenilaianDetail(pegawaiId: string, bulan?: number, tahun?: number) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id
    if (!userId || !ALLOWED_ROLES.includes(role)) return { error: "Akses ditolak" }

    const now = new Date()
    const b = bulan ?? now.getMonth() + 1
    const t = tahun ?? now.getFullYear()

    const penilai = await prisma.pegawai.findUnique({
      where: { userId },
      select: { id: true, bidangId: true }
    })

    const [pegawai, indeks, penilaian] = await Promise.all([
      prisma.pegawai.findUnique({
        where: { id: pegawaiId },
        select: {
          id: true, nama: true, jabatan: true, fotoUrl: true, sp: true,
          bidang: { select: { nama: true } },
          suratPeringatan: {
            where: { berlakuHingga: { gte: new Date() } },
            select: { jenis: true, berlakuHingga: true }
          }
        }
      }),
      prisma.indeksPegawai.findUnique({
        where: { pegawaiId_bulan_tahun: { pegawaiId, bulan: b, tahun: t } }
      }),
      prisma.penilaianAtasan.findFirst({
        where: { pegawaiId, penilaiId: penilai?.id ?? '', bulan: b, tahun: t }
      })
    ])

    if (!pegawai) return { error: "Pegawai tidak ditemukan" }

    return {
      success: true,
      pegawai,
      indeks,
      penilaian,
      bulan: b,
      tahun: t,
      penilaiId: penilai?.id
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ─── SAVE (upsert as DRAFT) ─────────────────────────────────────────
export async function savePenilaian(data: {
  pegawaiId: string
  bulan: number
  tahun: number
  indeksPegawaiId?: string | null
  disiplinKerja: number
  tanggungjawab: number
  kualitasKerja: number
  sikapKerja: number
  inisiatif: number
  kepatuhan: number
  catatanDisiplin?: string[]
  kelebihan?: string
  halPerluDiperbaiki?: string
  catatanAtasan?: string
  rekomendasi?: string
}) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id
    if (!userId || !ALLOWED_ROLES.includes(role)) return { error: "Akses ditolak" }

    const penilai = await prisma.pegawai.findUnique({ where: { userId }, select: { id: true } })
    if (!penilai) return { error: "Profil penilai tidak ditemukan" }

    const skorAtasan = hitungSkorAtasan(data)

    const result = await prisma.penilaianAtasan.upsert({
      where: {
        pegawaiId_penilaiId_bulan_tahun: {
          pegawaiId: data.pegawaiId,
          penilaiId: penilai.id,
          bulan: data.bulan,
          tahun: data.tahun
        }
      },
      update: {
        disiplinKerja: data.disiplinKerja,
        tanggungjawab: data.tanggungjawab,
        kualitasKerja: data.kualitasKerja,
        sikapKerja: data.sikapKerja,
        inisiatif: data.inisiatif,
        kepatuhan: data.kepatuhan,
        catatanDisiplin: data.catatanDisiplin ?? [],
        kelebihan: data.kelebihan ?? null,
        halPerluDiperbaiki: data.halPerluDiperbaiki ?? null,
        catatanAtasan: data.catatanAtasan ?? null,
        rekomendasi: data.rekomendasi ?? null,
        skorAtasan,
        indeksPegawaiId: data.indeksPegawaiId ?? null,
        status: 'DRAFT',
      },
      create: {
        pegawaiId: data.pegawaiId,
        penilaiId: penilai.id,
        bulan: data.bulan,
        tahun: data.tahun,
        disiplinKerja: data.disiplinKerja,
        tanggungjawab: data.tanggungjawab,
        kualitasKerja: data.kualitasKerja,
        sikapKerja: data.sikapKerja,
        inisiatif: data.inisiatif,
        kepatuhan: data.kepatuhan,
        catatanDisiplin: data.catatanDisiplin ?? [],
        kelebihan: data.kelebihan ?? null,
        halPerluDiperbaiki: data.halPerluDiperbaiki ?? null,
        catatanAtasan: data.catatanAtasan ?? null,
        rekomendasi: data.rekomendasi ?? null,
        skorAtasan,
        indeksPegawaiId: data.indeksPegawaiId ?? null,
        status: 'DRAFT',
      }
    })

    revalidatePath('/penilaian')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('savePenilaian error:', error)
    return { error: error.message }
  }
}

// ─── FINALISASI: Lock ke FINAL + update blended score ───────────────
export async function finalisasiPenilaian(penilaianId: string) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id
    if (!userId || !ALLOWED_ROLES.includes(role)) return { error: "Akses ditolak" }

    const penilaian = await prisma.penilaianAtasan.findUnique({
      where: { id: penilaianId },
      select: {
        id: true, status: true, pegawaiId: true, bulan: true, tahun: true,
        skorAtasan: true, indeksPegawaiId: true
      }
    })

    if (!penilaian) return { error: "Penilaian tidak ditemukan" }
    if (penilaian.status === 'FINAL') return { error: "Penilaian sudah final" }

    // Lock penilaian
    const updated = await prisma.penilaianAtasan.update({
      where: { id: penilaianId },
      data: { status: 'FINAL' }
    })

    // Update IndeksPegawai dengan skorAtasan & blended score
    if (penilaian.indeksPegawaiId) {
      const indeks = await prisma.indeksPegawai.findUnique({
        where: { id: penilaian.indeksPegawaiId },
        select: { totalSkor: true }
      })
      if (indeks) {
        const skorAkhirBlended = Math.round(
          (Number(indeks.totalSkor) * 0.6 + penilaian.skorAtasan * 0.4) * 10
        ) / 10
        await prisma.indeksPegawai.update({
          where: { id: penilaian.indeksPegawaiId },
          data: { skorAtasan: penilaian.skorAtasan, skorAkhirBlended }
        })
      }
    } else {
      // Cari indeks berdasarkan pegawaiId + bulan + tahun
      const indeks = await prisma.indeksPegawai.findUnique({
        where: {
          pegawaiId_bulan_tahun: {
            pegawaiId: penilaian.pegawaiId,
            bulan: penilaian.bulan,
            tahun: penilaian.tahun
          }
        }
      })
      if (indeks) {
        const skorAkhirBlended = Math.round(
          (Number(indeks.totalSkor) * 0.6 + penilaian.skorAtasan * 0.4) * 10
        ) / 10
        await prisma.indeksPegawai.update({
          where: { id: indeks.id },
          data: { skorAtasan: penilaian.skorAtasan, skorAkhirBlended }
        })
      }
    }

    revalidatePath('/penilaian')
    return { success: true, data: updated }
  } catch (error: any) {
    console.error('finalisasiPenilaian error:', error)
    return { error: error.message }
  }
}

// ─── GET: Riwayat 6 bulan untuk 1 pegawai ──────────────────────────
export async function getRiwayatPenilaian(pegawaiId: string) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id
    if (!userId || !ALLOWED_ROLES.includes(role)) return []

    const rows = await prisma.penilaianAtasan.findMany({
      where: { pegawaiId },
      include: {
        penilai: { select: { nama: true, jabatan: true } }
      },
      orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
      take: 6
    })

    const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
    return rows.map(r => ({
      ...r,
      label: `${bulanNames[r.bulan - 1]} ${r.tahun}`,
      penilaiNama: r.penilai.nama,
      penilaiJabatan: r.penilai.jabatan,
    }))
  } catch (error) {
    return []
  }
}

// ─── GET: Dashboard ringkasan untuk supervisor ───────────────────────
export async function getDashboardPenilaian(bulan?: number, tahun?: number) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id
    if (!userId || !ALLOWED_ROLES.includes(role)) return { error: "Akses ditolak" }

    const now = new Date()
    const b = bulan ?? now.getMonth() + 1
    const t = tahun ?? now.getFullYear()

    const penilai = await prisma.pegawai.findUnique({
      where: { userId },
      select: { id: true, bidangId: true }
    })

    let whereFilter: any = { status: 'AKTIF' }
    if ((role === 'KEPALA_BIDANG' || role === 'KEPALA_CABANG') && penilai?.bidangId) {
      whereFilter.bidangId = penilai.bidangId
    }

    const [totalPegawai, sudahDinilai, sudahFinal] = await Promise.all([
      prisma.pegawai.count({ where: whereFilter }),
      prisma.penilaianAtasan.count({
        where: {
          bulan: b, tahun: t,
          ...(penilai?.id ? { penilaiId: penilai.id } : {}),
        }
      }),
      prisma.penilaianAtasan.count({
        where: {
          bulan: b, tahun: t, status: 'FINAL',
          ...(penilai?.id ? { penilaiId: penilai.id } : {}),
        }
      })
    ])

    const belumDinilai = totalPegawai - sudahDinilai

    return {
      success: true,
      totalPegawai,
      sudahDinilai,
      sudahFinal,
      belumDinilai,
      persenSelesai: totalPegawai > 0 ? Math.round((sudahDinilai / totalPegawai) * 100) : 0,
    }
  } catch (error: any) {
    return { error: error.message }
  }
}
