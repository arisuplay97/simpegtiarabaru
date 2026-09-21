const fs = require('fs');

const fkMap = {
  FormasiJabatan: ['bidangId'],
  SubBidang: ['bidangId'],
  Pegawai: ['bidangId', 'subBidangId', 'lokasiAbsensiId', 'userId'],
  Mutasi: ['pegawaiId', 'approvedById'],
  Absensi: ['pegawaiId', 'importId'],
  Cuti: ['pegawaiId'],
  Payroll: ['pegawaiId'],
  KPI: ['pegawaiId'],
  SlipGaji: ['pegawaiId'],
  KGB: ['pegawaiId'],
  KenaikanPangkat: ['pegawaiId'],
  SuratPeringatan: ['pegawaiId'],
  PegawaiKeluarga: ['pegawaiId'],
  PegawaiPendidikan: ['pegawaiId'],
  PegawaiJabatan: ['pegawaiId'],
  PegawaiPangkat: ['pegawaiId'],
  PegawaiPelatihan: ['pegawaiId'],
  PegawaiDokumen: ['pegawaiId'],
  Notifikasi: ['userId'],
  PushSubscription: ['userId'],
  JadwalShift: ['pegawaiId', 'shiftId'],
  Lembur: ['pegawaiId'],
  PPh21: ['pegawaiId'],
  Kontrak: ['pegawaiId'],
  PenukaranPoin: ['pegawaiId', 'approvedById'],
  IndeksPegawai: ['pegawaiId'],
  BadgePegawai: ['pegawaiId'],
  PenilaianAtasan: ['pegawaiId', 'penilaiId', 'indeksPegawaiId']
};

const rawContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = rawContent.split(/\r?\n/);
let currentModel = null;
const outputLines = [];

for (let line of lines) {
  const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
    outputLines.push(line);
    continue;
  }
  if (line.trim().startsWith('}')) {
    currentModel = null;
    outputLines.push(line);
    continue;
  }

  // Check if PK has @default(cuid())
  if (line.includes('@id') && line.includes('@default(cuid())')) {
    line = line.replace('@default(cuid())', '@default(uuid(7)) @db.Uuid');
  }

  // Check if line is an FK in current model
  if (currentModel && fkMap[currentModel]) {
    const trimmed = line.trim();
    for (const fk of fkMap[currentModel]) {
      // e.g. "  pegawaiId       String" or "  bidangId  String?" or "  userId String @unique"
      const regex = new RegExp(`^(\\s*${fk}\\s+String\\??)(\\s*.*)$`);
      if (regex.test(line) && !line.includes('@db.Uuid') && !trimmed.startsWith('@relation')) {
        line = line.replace(regex, (match, p1, p2) => {
          if (p2.includes('@unique')) {
            return `${p1} @unique @db.Uuid${p2.replace('@unique', '')}`;
          }
          return `${p1} @db.Uuid${p2}`;
        });
        console.log(`[FK Updated] ${currentModel}.${fk}`);
      }
    }
  }

  outputLines.push(line);
}

const result = outputLines.join('\r\n');
fs.writeFileSync('prisma/schema.prisma.new', result, 'utf8');
console.log('Saved to prisma/schema.prisma.new');
