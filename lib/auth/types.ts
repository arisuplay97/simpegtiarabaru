export type AppRole = "super_admin" | "hrd" | "direktur" | "pegawai"

export type PermissionKey =
  | "dashboard.view"
  | "dashboard.director"
  | "approval.view"
  | "approval.act"
  | "pegawai.view"
  | "pegawai.manage"
  | "organisasi.view"
  | "formasi.view"
  | "mutasi.view"
  | "mutasi.manage"
  | "absensi.view"
  | "selfie.view"
  | "cuti.view"
  | "koreksi.view"
  | "lokasi.view"
  | "payroll.view"
  | "slip.view"
  | "kgb.view"
  | "kpi.view"
  | "pangkat.view"
  | "dokumen.view"
  | "sk.view"
  | "sp.view"
  | "sp.manage"
  | "users.view"
  | "users.manage"
  | "roles.view"
  | "roles.manage"

export interface DemoUser {
  id: string
  name: string
  email: string
  nik: string
  role: AppRole
  unit: string
  status: "active" | "inactive"
  lastLogin?: string
}
