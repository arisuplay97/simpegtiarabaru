const docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const fs = require("fs");

const content = fs.readFileSync("public/templates/template_surat_lengkap.docx", "binary");
const zip = new PizZip(content);
const doc = new docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

const data = {
  nomor_surat: "001/TEST/2026",
  lampiran: "-",
  perihal: "Test Template Update",
  tanggal_surat: "27 Maret 2026",
  kepada: "1. Bapak A\n2. Bapak B",
  tempat_tujuan: "Praya",
  isi_pembuka: "Ini awal surat",
  jabatan_penandatangan: "Direktur Utama",
  nama_penandatangan: "Ir. Boss",
  nik_penandatangan: "",
  label_nik: ""
};

doc.render(data);
const buf = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync("test_output.docx", buf);
console.log("Test generated");
