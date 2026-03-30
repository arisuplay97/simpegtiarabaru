import { getFormasiList } from "@/lib/actions/formasi"
import { prisma } from "@/lib/prisma"
import { FormasiClient } from "./client"

export default async function FormasiPage() {
  const [data, bidangList] = await Promise.all([
    getFormasiList(),
    prisma.bidang.findMany({ select: { id: true, nama: true }, orderBy: { nama: 'asc' } })
  ])

  return <FormasiClient initialData={data} bidangList={bidangList} />
}
