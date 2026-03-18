export type ApprovalType = "cuti_biasa" | "cuti_panjang" | "lembur" | "koreksi_absensi" | "payroll" | "mutasi" | "kenaikan_pangkat" | "kgb"
export type ApprovalStepStatus = "pending" | "approved" | "rejected"

export interface ApprovalStep {
  step: number; role: "hrd" | "direktur"; label: string
  status: ApprovalStepStatus; approvedBy?: string; approvedAt?: string; catatan?: string
}

export interface Pengajuan {
  id: string; type: ApprovalType; title: string
  pengajuId: string; pengajuName: string; pengajuInitials: string
  pengajuUnit: string; pengajuNik: string; tanggalAjuan: string
  priority: "normal" | "urgent" | "overdue"
  data: Record<string, string>
  steps: ApprovalStep[]; currentStep: number
  finalStatus: "pending" | "approved" | "rejected"
}

export const getApprovalSteps = (type: ApprovalType): ApprovalStep[] => {
  const hrd = [{ step: 1, role: "hrd" as const, label: "Persetujuan HRD", status: "pending" as const }]
  const both = [{ step: 1, role: "hrd" as const, label: "Verifikasi HRD", status: "pending" as const }, { step: 2, role: "direktur" as const, label: "Persetujuan Direktur", status: "pending" as const }]
  return ["cuti_biasa","lembur","koreksi_absensi"].includes(type) ? hrd : both
}

export const canApprove = (p: Pengajuan, role: string): boolean => {
  if (p.finalStatus !== "pending") return false
  if (role === "super_admin") return true
  return p.steps[p.currentStep - 1]?.role === role
}

export const processApprove = (p: Pengajuan, name: string, catatan?: string): Pengajuan => {
  const u = { ...p, steps: [...p.steps] }
  u.steps[p.currentStep - 1] = { ...u.steps[p.currentStep - 1], status: "approved", approvedBy: name, approvedAt: new Date().toLocaleString("id-ID"), catatan }
  if (u.currentStep < u.steps.length) u.currentStep += 1
  else u.finalStatus = "approved"
  return u
}

export const processReject = (p: Pengajuan, name: string, alasan: string): Pengajuan => {
  const u = { ...p, steps: [...p.steps] }
  u.steps[p.currentStep - 1] = { ...u.steps[p.currentStep - 1], status: "rejected", approvedBy: name, approvedAt: new Date().toLocaleString("id-ID"), catatan: alasan }
  u.finalStatus = "rejected"
  return u
}
