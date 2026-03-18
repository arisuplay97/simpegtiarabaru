import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = bcrypt.hashSync("123456", 10)

  // Demo users mapping
  const usersData = [
    { email: "superadmin@tiara.com", role: "SUPERADMIN" },
    { email: "hrd@tiara.com", role: "HRD" },
    { email: "direksi@tiara.com", role: "DIREKSI" },
    { email: "pegawai@tiara.com", role: "PEGAWAI" },
  ]

  // Employee data from pegawai-store.ts
  const employeesData = [
    { nik:"3201150115850001", nama:"Ahmad Rizki Pratama", initials:"AR", jabatan:"Kepala Bagian IT", unitKerja:"IT & Sistem", golongan:"C/III", pangkat:"Penata", status:"aktif", sp:null, email:"ahmad.rizki@pdamtiara.co.id", telepon:"081234567890", jenisKelamin:"L", tanggalMasuk:"15 Jan 2010", tempatLahir:"Bandung", tanggalLahir:"15 Jan 1985", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Merdeka No. 123, Jakarta Selatan", npwp:"12.345.678.9-012.345", bank:"Bank Mandiri", noRekening:"1234567890123", bpjsKes:"0001234567890", bpjsTK:"0001234567891", pendidikan:"S2 - Teknik Informatika" },
    { nik:"3201032215900001", nama:"Siti Nurhaliza", initials:"SN", jabatan:"Staff Keuangan Senior", unitKerja:"Keuangan", golongan:"B/III", pangkat:"Penata Muda Tk.I", status:"aktif", sp:null, email:"siti.nurhaliza@pdamtiara.co.id", telepon:"081234567891", jenisKelamin:"P", tanggalMasuk:"22 Jan 2015", tempatLahir:"Jakarta", tanggalLahir:"22 Mar 1990", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Sudirman No. 45, Jakarta Pusat", npwp:"12.345.678.9-012.346", bank:"Bank BNI", noRekening:"9876543210", bpjsKes:"0001234567891", bpjsTK:"0001234567892", pendidikan:"S1 - Akuntansi" },
    { nik:"3201050512870001", nama:"Budi Santoso", initials:"BS", jabatan:"Supervisor Distribusi", unitKerja:"Distribusi", golongan:"D/III", pangkat:"Penata Tk.I", status:"cuti", sp:"SP1", email:"budi.santoso@pdamtiara.co.id", telepon:"081234567892", jenisKelamin:"L", tanggalMasuk:"05 Jan 2008", tempatLahir:"Surabaya", tanggalLahir:"12 Mei 1987", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Gatot Subroto No. 78, Jakarta Selatan", npwp:"12.345.678.9-012.347", bank:"Bank BRI", noRekening:"1122334455", bpjsKes:"0001234567892", bpjsTK:"0001234567893", pendidikan:"S1 - Teknik Sipil" },
    { nik:"3201051519920001", nama:"Dewi Lestari", initials:"DL", jabatan:"Customer Service", unitKerja:"Pelayanan", golongan:"A/III", pangkat:"Penata Muda", status:"aktif", sp:null, email:"dewi.lestari@pdamtiara.co.id", telepon:"081234567893", jenisKelamin:"P", tanggalMasuk:"15 Jan 2018", tempatLahir:"Bandung", tanggalLahir:"15 Mei 1992", agama:"Islam", statusNikah:"Belum Menikah", alamat:"Jl. Thamrin No. 22, Jakarta Pusat", npwp:"12.345.678.9-012.348", bank:"Bank Mandiri", noRekening:"5566778899", bpjsKes:"0001234567893", bpjsTK:"0001234567894", pendidikan:"D3 - Manajemen Pemasaran" },
    { nik:"3201081519800001", nama:"Eko Prasetyo", initials:"EP", jabatan:"Operator IPA", unitKerja:"Produksi", golongan:"D/II", pangkat:"Pengatur Tk.I", status:"aktif", sp:null, email:"eko.prasetyo@pdamtiara.co.id", telepon:"081234567894", jenisKelamin:"L", tanggalMasuk:"15 Jan 2005", tempatLahir:"Yogyakarta", tanggalLahir:"15 Agu 1980", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Kuningan No. 55, Jakarta Selatan", npwp:"12.345.678.9-012.349", bank:"Bank BRI", noRekening:"9988776655", bpjsKes:"0001234567894", bpjsTK:"0001234567895", pendidikan:"SMA - IPA" },
    { nik:"3201010101930002", nama:"Fitri Handayani", initials:"FH", jabatan:"Staff HRD", unitKerja:"SDM & Umum", golongan:"A/III", pangkat:"Penata Muda", status:"aktif", sp:null, email:"fitri.handayani@pdamtiara.co.id", telepon:"081234567895", jenisKelamin:"P", tanggalMasuk:"20 Jan 2020", tempatLahir:"Semarang", tanggalLahir:"20 Agu 1993", agama:"Islam", statusNikah:"Belum Menikah", alamat:"Jl. Senayan No. 10, Jakarta Selatan", npwp:"12.345.678.9-012.350", bank:"Bank BNI", noRekening:"1133557799", bpjsKes:"0001234567895", bpjsTK:"0001234567896", pendidikan:"S1 - Psikologi" },
    { nik:"3201100619750003", nama:"Ir. Gunawan Wibowo", initials:"GW", jabatan:"Manager Produksi", unitKerja:"Produksi", golongan:"A/IV", pangkat:"Pembina", status:"aktif", sp:"SP2", email:"gunawan.wibowo@pdamtiara.co.id", telepon:"081234567896", jenisKelamin:"L", tanggalMasuk:"10 Jun 1998", tempatLahir:"Jakarta", tanggalLahir:"10 Jun 1975", agama:"Kristen", statusNikah:"Menikah", alamat:"Jl. Kemang Raya No. 99, Jakarta Selatan", npwp:"12.345.678.9-012.351", bank:"Bank Mandiri", noRekening:"2244668800", bpjsKes:"0001234567896", bpjsTK:"0001234567897", pendidikan:"S1 - Teknik Kimia" },
    { nik:"3201041519890001", nama:"Hendra Kusuma", initials:"HK", jabatan:"Teknisi Distribusi", unitKerja:"Distribusi", golongan:"C/II", pangkat:"Pengatur", status:"aktif", sp:null, email:"hendra.kusuma@pdamtiara.co.id", telepon:"081234567897", jenisKelamin:"L", tanggalMasuk:"15 Apr 2012", tempatLahir:"Bekasi", tanggalLahir:"15 Apr 1989", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Bekasi Timur No. 33, Bekasi", npwp:"12.345.678.9-012.352", bank:"Bank BRI", noRekening:"3355779911", bpjsKes:"0001234567897", bpjsTK:"0001234567898", pendidikan:"D3 - Teknik Mesin" },
    { nik:"3201010101650003", nama:"Ir. Joko Wibowo", initials:"JW", jabatan:"Direktur Utama", unitKerja:"Direksi", golongan:"E/IV", pangkat:"Pembina Utama", status:"aktif", sp:null, email:"joko.wibowo@pdamtiara.co.id", telepon:"081234567898", jenisKelamin:"L", tanggalMasuk:"20 Jan 1990", tempatLahir:"Solo", tanggalLahir:"20 Jan 1965", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Menteng Raya No. 50, Jakarta Pusat", npwp:"12.345.678.9-012.353", bank:"Bank Mandiri", noRekening:"4466880022", bpjsKes:"0001234567898", bpjsTK:"0001234567899", pendidikan:"S2 - Manajemen" },
    { nik:"3201010101600001", nama:"Karno Sutrisno", initials:"KS", jabatan:"Staff Senior", unitKerja:"Pelayanan", golongan:"D/III", pangkat:"Penata Tk.I", status:"pensiun", sp:"SP3", email:"karno.sutrisno@pdamtiara.co.id", telepon:"081234567899", jenisKelamin:"L", tanggalMasuk:"01 Jan 1985", tempatLahir:"Purwokerto", tanggalLahir:"01 Jan 1960", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Cempaka Putih No. 77, Jakarta Pusat", npwp:"12.345.678.9-012.354", bank:"Bank BNI", noRekening:"5577991133", bpjsKes:"0001234567899", bpjsTK:"0001234567900", pendidikan:"S1 - Administrasi Negara" },
    { nik:"3201011519850001", nama:"Lina Marlina", initials:"LM", jabatan:"Kepala Bagian Keuangan", unitKerja:"Keuangan", golongan:"D/III", pangkat:"Penata Tk.I", status:"aktif", sp:null, email:"lina.marlina@pdamtiara.co.id", telepon:"081234567900", jenisKelamin:"P", tanggalMasuk:"10 Mar 2009", tempatLahir:"Cirebon", tanggalLahir:"10 Mar 1985", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Rasuna Said No. 15, Jakarta Selatan", npwp:"12.345.678.9-012.355", bank:"Bank Mandiri", noRekening:"6688002244", bpjsKes:"0001234567900", bpjsTK:"0001234567901", pendidikan:"S1 - Akuntansi" },
    { nik:"3201061519910001", nama:"Made Suardana", initials:"MS", jabatan:"Teknisi IPA", unitKerja:"Produksi", golongan:"B/II", pangkat:"Pengatur Muda Tk.I", status:"aktif", sp:null, email:"made.suardana@pdamtiara.co.id", telepon:"081234567901", jenisKelamin:"L", tanggalMasuk:"15 Jun 2016", tempatLahir:"Denpasar", tanggalLahir:"15 Jun 1991", agama:"Hindu", statusNikah:"Menikah", alamat:"Jl. Kuningan Timur No. 20, Jakarta Selatan", npwp:"12.345.678.9-012.356", bank:"Bank BNI", noRekening:"7799113355", bpjsKes:"0001234567901", bpjsTK:"0001234567902", pendidikan:"D3 - Teknik Kimia" },
  ]

  console.log("Seeding users and employees...")

  for (const emp of employeesData) {
    // Determine role based on email or default to PEGAWAI
    let role = "PEGAWAI"
    if (emp.email.includes("superadmin")) role = "SUPERADMIN"
    else if (emp.email.includes("hrd")) role = "HRD"
    else if (emp.email.includes("gunawan.wibowo") || emp.email.includes("joko.wibowo")) role = "DIREKSI"

    // Special cases for initial users to ensure they exist as defined in auth
    const userEmail = emp.email.includes("ahmad.rizki") ? "pegawai@tiara.com" : emp.email
    
    await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        password: password,
        role: role as any,
        pegawai: {
          create: {
            nik: emp.nik,
            nama: emp.nama,
            initials: emp.initials,
            jabatan: emp.jabatan,
            unitKerja: emp.unitKerja,
            golongan: emp.golongan,
            pangkat: emp.pangkat,
            status: emp.status,
            sp: emp.sp,
            email: emp.email,
            telepon: emp.telepon,
            jenisKelamin: emp.jenisKelamin,
            tanggalMasuk: emp.tanggalMasuk,
            tempatLahir: emp.tempatLahir,
            tanggalLahir: emp.tanggalLahir,
            agama: emp.agama,
            statusNikah: emp.statusNikah,
            alamat: emp.alamat,
            npwp: emp.npwp,
            bank: emp.bank,
            noRekening: emp.noRekening,
            bpjsKes: emp.bpjsKes,
            bpjsTK: emp.bpjsTK,
            pendidikan: emp.pendidikan,
          }
        }
      },
    })
  }

  // Also ensure the special demo users exist if not already created
  const extraUsers = [
    { email: "superadmin@tiara.com", role: "SUPERADMIN" },
    { email: "hrd@tiara.com", role: "HRD" },
    { email: "direksi@tiara.com", role: "DIREKSI" },
  ]

  for (const user of extraUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: password,
        role: user.role as any,
      }
    })
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
