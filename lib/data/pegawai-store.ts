// ============ TIPE DATA ============
export interface Pegawai {
  id: string
  nik: string
  nama: string
  initials: string
  jabatan: string
  unitKerja: string
  golongan: string
  pangkat: string
  status: "aktif" | "cuti" | "non-aktif" | "pensiun"
  sp: "SP1" | "SP2" | "SP3" | null
  masaKerja: string
  email: string
  telepon: string
  jenisKelamin: "L" | "P"
  tanggalMasuk: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
  statusNikah: string
  alamat: string
  noKTP: string
  npwp: string
  bank: string
  noRekening: string
  bpjsKes: string
  bpjsTK: string
  pendidikan: string
  avatar?: string
  // Optional for detail profile
  golonganDarah?: string
  noKK?: string
  teleponKantor?: string
  emailPersonal?: string
}

// ============ DATA DUMMY LENGKAP ============
export const pegawaiData: Pegawai[] = [
  { id:"1", nik:"3201150115850001", nama:"Ahmad Rizki Pratama", initials:"AR", jabatan:"Kepala Bagian IT", unitKerja:"IT & Sistem", golongan:"C/III", pangkat:"Penata", status:"aktif", sp:null, masaKerja:"16 tahun", email:"ahmad.rizki@pdamtiara.co.id", telepon:"081234567890", jenisKelamin:"L", tanggalMasuk:"15 Jan 2010", tempatLahir:"Bandung", tanggalLahir:"15 Jan 1985", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Merdeka No. 123, Jakarta Selatan", noKTP:"3201150115850001", npwp:"12.345.678.9-012.345", bank:"Bank Mandiri", noRekening:"1234567890123", bpjsKes:"0001234567890", bpjsTK:"0001234567891", pendidikan:"S2 - Teknik Informatika", golonganDarah:"O", noKK:"3201010203040001", teleponKantor:"021-5551234", emailPersonal:"ahmadrizki@gmail.com" },
  { id:"2", nik:"3201032215900001", nama:"Siti Nurhaliza", initials:"SN", jabatan:"Staff Keuangan Senior", unitKerja:"Keuangan", golongan:"B/III", pangkat:"Penata Muda Tk.I", status:"aktif", sp:null, masaKerja:"11 tahun", email:"siti.nurhaliza@pdamtiara.co.id", telepon:"081234567891", jenisKelamin:"P", tanggalMasuk:"22 Jan 2015", tempatLahir:"Jakarta", tanggalLahir:"22 Mar 1990", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Sudirman No. 45, Jakarta Pusat", noKTP:"3201032215900001", npwp:"12.345.678.9-012.346", bank:"Bank BNI", noRekening:"9876543210", bpjsKes:"0001234567891", bpjsTK:"0001234567892", pendidikan:"S1 - Akuntansi" },
  { id:"3", nik:"3201050512870001", nama:"Budi Santoso", initials:"BS", jabatan:"Supervisor Distribusi", unitKerja:"Distribusi", golongan:"D/III", pangkat:"Penata Tk.I", status:"cuti", sp:"SP1", masaKerja:"18 tahun", email:"budi.santoso@pdamtiara.co.id", telepon:"081234567892", jenisKelamin:"L", tanggalMasuk:"05 Jan 2008", tempatLahir:"Surabaya", tanggalLahir:"12 Mei 1987", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Gatot Subroto No. 78, Jakarta Selatan", noKTP:"3201050512870001", npwp:"12.345.678.9-012.347", bank:"Bank BRI", noRekening:"1122334455", bpjsKes:"0001234567892", bpjsTK:"0001234567893", pendidikan:"S1 - Teknik Sipil" },
  { id:"4", nik:"3201051519920001", nama:"Dewi Lestari", initials:"DL", jabatan:"Customer Service", unitKerja:"Pelayanan", golongan:"A/III", pangkat:"Penata Muda", status:"aktif", sp:null, masaKerja:"8 tahun", email:"dewi.lestari@pdamtiara.co.id", telepon:"081234567893", jenisKelamin:"P", tanggalMasuk:"15 Jan 2018", tempatLahir:"Bandung", tanggalLahir:"15 Mei 1992", agama:"Islam", statusNikah:"Belum Menikah", alamat:"Jl. Thamrin No. 22, Jakarta Pusat", noKTP:"3201051519920001", npwp:"12.345.678.9-012.348", bank:"Bank Mandiri", noRekening:"5566778899", bpjsKes:"0001234567893", bpjsTK:"0001234567894", pendidikan:"D3 - Manajemen Pemasaran" },
  { id:"5", nik:"3201081519800001", nama:"Eko Prasetyo", initials:"EP", jabatan:"Operator IPA", unitKerja:"Produksi", golongan:"D/II", pangkat:"Pengatur Tk.I", status:"aktif", sp:null, masaKerja:"21 tahun", email:"eko.prasetyo@pdamtiara.co.id", telepon:"081234567894", jenisKelamin:"L", tanggalMasuk:"15 Jan 2005", tempatLahir:"Yogyakarta", tanggalLahir:"15 Agu 1980", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Kuningan No. 55, Jakarta Selatan", noKTP:"3201081519800001", npwp:"12.345.678.9-012.349", bank:"Bank BRI", noRekening:"9988776655", bpjsKes:"0001234567894", bpjsTK:"0001234567895", pendidikan:"SMA - IPA" },
  { id:"6", nik:"3201010101930002", nama:"Fitri Handayani", initials:"FH", jabatan:"Staff HRD", unitKerja:"SDM & Umum", golongan:"A/III", pangkat:"Penata Muda", status:"aktif", sp:null, masaKerja:"6 tahun", email:"fitri.handayani@pdamtiara.co.id", telepon:"081234567895", jenisKelamin:"P", tanggalMasuk:"20 Jan 2020", tempatLahir:"Semarang", tanggalLahir:"20 Agu 1993", agama:"Islam", statusNikah:"Belum Menikah", alamat:"Jl. Senayan No. 10, Jakarta Selatan", noKTP:"3201010101930002", npwp:"12.345.678.9-012.350", bank:"Bank BNI", noRekening:"1133557799", bpjsKes:"0001234567895", bpjsTK:"0001234567896", pendidikan:"S1 - Psikologi" },
  { id:"7", nik:"3201100619750003", nama:"Ir. Gunawan Wibowo", initials:"GW", jabatan:"Manager Produksi", unitKerja:"Produksi", golongan:"A/IV", pangkat:"Pembina", status:"aktif", sp:"SP2", masaKerja:"28 tahun", email:"gunawan.wibowo@pdamtiara.co.id", telepon:"081234567896", jenisKelamin:"L", tanggalMasuk:"10 Jun 1998", tempatLahir:"Jakarta", tanggalLahir:"10 Jun 1975", agama:"Kristen", statusNikah:"Menikah", alamat:"Jl. Kemang Raya No. 99, Jakarta Selatan", noKTP:"3201100619750003", npwp:"12.345.678.9-012.351", bank:"Bank Mandiri", noRekening:"2244668800", bpjsKes:"0001234567896", bpjsTK:"0001234567897", pendidikan:"S1 - Teknik Kimia" },
  { id:"8", nik:"3201041519890001", nama:"Hendra Kusuma", initials:"HK", jabatan:"Teknisi Distribusi", unitKerja:"Distribusi", golongan:"C/II", pangkat:"Pengatur", status:"aktif", sp:null, masaKerja:"14 tahun", email:"hendra.kusuma@pdamtiara.co.id", telepon:"081234567897", jenisKelamin:"L", tanggalMasuk:"15 Apr 2012", tempatLahir:"Bekasi", tanggalLahir:"15 Apr 1989", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Bekasi Timur No. 33, Bekasi", noKTP:"3201041519890001", npwp:"12.345.678.9-012.352", bank:"Bank BRI", noRekening:"3355779911", bpjsKes:"0001234567897", bpjsTK:"0001234567898", pendidikan:"D3 - Teknik Mesin" },
  { id:"9", nik:"3201010101650003", nama:"Ir. Joko Wibowo", initials:"JW", jabatan:"Direktur Utama", unitKerja:"Direksi", golongan:"E/IV", pangkat:"Pembina Utama", status:"aktif", sp:null, masaKerja:"36 tahun", email:"joko.wibowo@pdamtiara.co.id", telepon:"081234567898", jenisKelamin:"L", tanggalMasuk:"20 Jan 1990", tempatLahir:"Solo", tanggalLahir:"20 Jan 1965", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Menteng Raya No. 50, Jakarta Pusat", noKTP:"3201010101650003", npwp:"12.345.678.9-012.353", bank:"Bank Mandiri", noRekening:"4466880022", bpjsKes:"0001234567898", bpjsTK:"0001234567899", pendidikan:"S2 - Manajemen" },
  { id:"10", nik:"3201010101600001", nama:"Karno Sutrisno", initials:"KS", jabatan:"Staff Senior", unitKerja:"Pelayanan", golongan:"D/III", pangkat:"Penata Tk.I", status:"pensiun", sp:"SP3", masaKerja:"35 tahun", email:"karno.sutrisno@pdamtiara.co.id", telepon:"081234567899", jenisKelamin:"L", tanggalMasuk:"01 Jan 1985", tempatLahir:"Purwokerto", tanggalLahir:"01 Jan 1960", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Cempaka Putih No. 77, Jakarta Pusat", noKTP:"3201010101600001", npwp:"12.345.678.9-012.354", bank:"Bank BNI", noRekening:"5577991133", bpjsKes:"0001234567899", bpjsTK:"0001234567900", pendidikan:"S1 - Administrasi Negara" },
  { id:"11", nik:"3201011519850001", nama:"Lina Marlina", initials:"LM", jabatan:"Kepala Bagian Keuangan", unitKerja:"Keuangan", golongan:"D/III", pangkat:"Penata Tk.I", status:"aktif", sp:null, masaKerja:"17 tahun", email:"lina.marlina@pdamtiara.co.id", telepon:"081234567900", jenisKelamin:"P", tanggalMasuk:"10 Mar 2009", tempatLahir:"Cirebon", tanggalLahir:"10 Mar 1985", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Rasuna Said No. 15, Jakarta Selatan", noKTP:"3201011519850001", npwp:"12.345.678.9-012.355", bank:"Bank Mandiri", noRekening:"6688002244", bpjsKes:"0001234567900", bpjsTK:"0001234567901", pendidikan:"S1 - Akuntansi" },
  { id:"12", nik:"3201061519910001", nama:"Made Suardana", initials:"MS", jabatan:"Teknisi IPA", unitKerja:"Produksi", golongan:"B/II", pangkat:"Pengatur Muda Tk.I", status:"aktif", sp:null, masaKerja:"10 tahun", email:"made.suardana@pdamtiara.co.id", telepon:"081234567901", jenisKelamin:"L", tanggalMasuk:"15 Jun 2016", tempatLahir:"Denpasar", tanggalLahir:"15 Jun 1991", agama:"Hindu", statusNikah:"Menikah", alamat:"Jl. Kuningan Timur No. 20, Jakarta Selatan", noKTP:"3201061519910001", npwp:"12.345.678.9-012.356", bank:"Bank BNI", noRekening:"7799113355", bpjsKes:"0001234567901", bpjsTK:"0001234567902", pendidikan:"D3 - Teknik Kimia" },
]

export function getStats(employees: Pegawai[]) {
  return {
    total: employees.length,
    aktif: employees.filter(e => e.status === "aktif").length,
    cuti: employees.filter(e => e.status === "cuti").length,
    nonAktif: employees.filter(e => e.status === "non-aktif" || e.status === "pensiun").length
  }
}
