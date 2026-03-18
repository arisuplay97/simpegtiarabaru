import type { AppRole, PermissionKey } from "./types"

export const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  HRD: "HRD",
  DIREKSI: "Direksi",
  PEGAWAI: "Pegawai",
}

export const rolePermissions: Record<string, string[]> = {
  SUPERADMIN: [
    "dashboard.view",
    "dashboard.director",
    "approval.view",
    "approval.act",
    "pegawai.view",
    "pegawai.manage",
    "organisasi.view",
    "formasi.view",
    "mutasi.view",
    "mutasi.manage",
    "absensi.view",
    "selfie.view",
    "cuti.view",
    "koreksi.view",
    "lokasi.view",
    "payroll.view",
    "slip.view",
    "kgb.view",
    "kpi.view",
    "pangkat.view",
    "dokumen.view",
    "sk.view",
    "sp.view",
    "sp.manage",
    "users.view",
    "users.manage",
    "roles.view",
    "roles.manage",
  ],
  HRD: [
    "dashboard.view",
    "approval.view",
    "approval.act",
    "pegawai.view",
    "pegawai.manage",
    "organisasi.view",
    "formasi.view",
    "mutasi.view",
    "mutasi.manage",
    "absensi.view",
    "selfie.view",
    "cuti.view",
    "koreksi.view",
    "lokasi.view",
    "payroll.view",
    "slip.view",
    "kgb.view",
    "kpi.view",
    "pangkat.view",
    "dokumen.view",
    "sk.view",
    "sp.view",
    "sp.manage",
    "users.view",
    "users.manage",
    "roles.view",
  ],
  DIREKSI: [
    "dashboard.view",
    "dashboard.director",
    "approval.view",
    "approval.act",
    "pegawai.view",
    "organisasi.view",
    "formasi.view",
    "mutasi.view",
    "absensi.view",
    "cuti.view",
    "slip.view",
    "kpi.view",
    "pangkat.view",
    "dokumen.view",
    "sk.view",
    "sp.view",
  ],
  PEGAWAI: [
    "dashboard.view",
    "absensi.view",
    "selfie.view",
    "cuti.view",
    "slip.view",
    "dokumen.view",
  ],
}

export function hasPermission(role: string | null | undefined, permission: string) {
  if (!role) return false
  return rolePermissions[role]?.includes(permission) ?? false
}

export function routeAccess(pathname: string): PermissionKey | null {
  if (pathname === "/") return "dashboard.view"
  if (pathname.startsWith("/dashboard/direksi")) return "dashboard.director"
  if (pathname.startsWith("/approval")) return "approval.view"
  if (pathname.startsWith("/pegawai")) return "pegawai.view"
  if (pathname.startsWith("/organisasi")) return "organisasi.view"
  if (pathname.startsWith("/formasi")) return "formasi.view"
  if (pathname.startsWith("/mutasi")) return "mutasi.view"
  if (pathname.startsWith("/absensi/selfie")) return "selfie.view"
  if (pathname.startsWith("/absensi")) return "absensi.view"
  if (pathname.startsWith("/cuti")) return "cuti.view"
  if (pathname.startsWith("/koreksi-absensi") || pathname.startsWith("/absensi/koreksi")) return "koreksi.view"
  if (pathname.startsWith("/settings/lokasi") || pathname.startsWith("/lokasi-absensi")) return "lokasi.view"
  if (pathname.startsWith("/payroll")) return "payroll.view"
  if (pathname.startsWith("/slip-gaji")) return "slip.view"
  if (pathname.startsWith("/kgb")) return "kgb.view"
  if (pathname.startsWith("/kpi")) return "kpi.view"
  if (pathname.startsWith("/kenaikan-pangkat")) return "pangkat.view"
  if (pathname.startsWith("/dokumen")) return "dokumen.view"
  if (pathname.startsWith("/sk") || pathname.startsWith("/surat-keputusan")) return "sk.view"
  if (pathname.startsWith("/sp")) return "sp.view"
  if (pathname.startsWith("/settings/users")) return "users.view"
  if (pathname.startsWith("/settings/role")) return "roles.view"
  return null
}
