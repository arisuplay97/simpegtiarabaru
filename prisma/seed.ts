import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = bcrypt.hashSync("123456", 10)

  console.log("Seeding Bidang...")
  const bidangList = [
    { nama: "IT & Sistem", kode: "IT", kepalaBidang: "Ahmad Rizki Pratama", direkturAtasan: "Direktur Teknik" },
    { nama: "Keuangan", kode: "KEU", kepalaBidang: "Siti Nurhaliza", direkturAtasan: "Direktur Umum" },
    { nama: "Distribusi", kode: "DIST", kepalaBidang: "Budi Santoso", direkturAtasan: "Direktur Teknik" },
    { nama: "Pelayanan", kode: "PEL", kepalaBidang: "Dewi Lestari", direkturAtasan: "Direktur Umum" },
    { nama: "Produksi", kode: "PROD", kepalaBidang: "Ir. Gunawan Wibowo", direkturAtasan: "Direktur Teknik" },
    { nama: "SDM & Umum", kode: "SDM", kepalaBidang: "Fitri Handayani", direkturAtasan: "Direktur Umum" },
    { nama: "Direksi", kode: "DIR", kepalaBidang: "Ir. Joko Widagdo", direkturAtasan: "Dewan Pengawas" },
  ]

  const createdBidang: Record<string, string> = {}
  for (const b of bidangList) {
    const res = await prisma.bidang.upsert({
      where: { nama: b.nama },
      update: {},
      create: { ...b, aktif: true },
    })
    createdBidang[b.nama] = res.id
  }

  // Employee data
  const employeesData = [
    { nik:"3201150115850001", nama:"Ahmad Rizki Pratama", jabatan:"Kepala Bagian IT", unitKerja:"IT & Sistem", golongan:"C/III", pangkat:"Penata", status:"AKTIF", email:"ahmad.rizki@pdamtiara.co.id", telepon:"081234567890", jenisKelamin:"L", tanggalMasuk:"2010-01-15", tempatLahir:"Bandung", tanggalLahir:"1985-01-15", agama:"ISLAM", statusNikah:"MENIKAH", alamat:"Jl. Merdeka No. 123, Jakarta Selatan", npwp:"12.345.678.9-012.345", bank:"Bank Mandiri", noRekening:"1234567890123", bpjsKesehatan:"0001234567890", bpjsKetenagakerjaan:"0001234567891", pendidikan:"S2 - Teknik Informatika" },
    { nik:"3201032215900001", nama:"Siti Nurhaliza", jabatan:"Staff Keuangan Senior", unitKerja:"Keuangan", golongan:"B/III", pangkat:"Penata Muda Tk.I", status:"AKTIF", email:"siti.nurhaliza@pdamtiara.co.id", telepon:"081234567891", jenisKelamin:"P", tanggalMasuk:"2015-01-22", tempatLahir:"Jakarta", tanggalLahir:"1990-03-22", agama:"ISLAM", statusNikah:"MENIKAH", alamat:"Jl. Sudirman No. 45, Jakarta Pusat", npwp:"12.345.678.9-012.346", bank:"Bank BNI", noRekening:"9876543210", bpjsKesehatan:"0001234567891", bpjsKetenagakerjaan:"0001234567892", pendidikan:"S1 - Akuntansi" },
    { nik:"3201050512870001", nama:"Budi Santoso", jabatan:"Supervisor Distribusi", unitKerja:"Distribusi", golongan:"D/III", pangkat:"Penata Tk.I", status:"CUTI", email:"budi.santoso@pdamtiara.co.id", telepon:"081234567892", jenisKelamin:"L", tanggalMasuk:"2008-01-05", tempatLahir:"Surabaya", tanggalLahir:"1987-05-12", agama:"ISLAM", statusNikah:"MENIKAH", alamat:"Jl. Gatot Subroto No. 78, Jakarta Selatan", npwp:"12.345.678.9-012.347", bank:"Bank BRI", noRekening:"1122334455", bpjsKesehatan:"0001234567892", bpjsKetenagakerjaan:"0001234567893", pendidikan:"S1 - Teknik Sipil" },
  ]

  console.log("Seeding Users and Employees...")
  for (const emp of employeesData) {
    try {
      const userEmail = emp.email.includes("ahmad.rizki") ? "pegawai@tiara.com" : emp.email
      
      const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          email: userEmail,
          password: password,
          role: "PEGAWAI",
        },
      })

      const nikExists = await prisma.pegawai.findUnique({ where: { nik: emp.nik } })
      if (!nikExists) {
        await prisma.pegawai.create({
          data: {
            nik: emp.nik,
            nama: emp.nama,
            email: emp.email,
            telepon: emp.telepon,
            bidangId: createdBidang[emp.unitKerja] || null,
            jabatan: emp.jabatan,
            golongan: emp.golongan,
            pangkat: emp.pangkat,
            status: emp.status as any,
            tanggalMasuk: new Date(emp.tanggalMasuk),
            jenisKelamin: emp.jenisKelamin as any,
            tempatLahir: emp.tempatLahir,
            tanggalLahir: emp.tanggalLahir ? new Date(emp.tanggalLahir) : null,
            agama: emp.agama as any,
            statusNikah: emp.statusNikah as any,
            alamat: emp.alamat,
            npwp: emp.npwp,
            bank: emp.bank,
            noRekening: emp.noRekening,
            bpjsKesehatan: emp.bpjsKesehatan,
            bpjsKetenagakerjaan: emp.bpjsKetenagakerjaan,
            pendidikanTerakhir: emp.pendidikan.split(" - ")[0] as any,
            jurusan: emp.pendidikan.split(" - ")[1] || null,
            userId: user.id
          }
        })
        console.log(`Created employee: ${emp.nama}`)
      }
    } catch (e) {
      console.error(`Error seeding ${emp.nama}:`, e)
    }
  }

  // Demo Admin users
  const adminUsers = [
    { email: "superadmin@tiara.com", role: "SUPERADMIN" },
    { email: "hrd@tiara.com", role: "HRD" },
    { email: "direksi@tiara.com", role: "DIREKSI" },
  ]

  for (const u of adminUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: password,
        role: u.role as any,
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
