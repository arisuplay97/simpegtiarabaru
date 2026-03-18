import Link from "next/link"

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-lg rounded-3xl border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">403</div>
        <h1 className="text-2xl font-bold text-slate-900">Akses Ditolak</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Role aktif Anda tidak memiliki izin untuk membuka halaman ini. Silakan kembali ke dashboard atau login menggunakan role yang sesuai.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="rounded-xl bg-[#0f3b6e] px-4 py-2 text-sm font-medium text-white">Kembali ke Dashboard</Link>
          <Link href="/login" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Pilih Role Lain</Link>
        </div>
      </div>
    </div>
  )
}
