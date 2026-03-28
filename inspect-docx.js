const AdmZip = require("adm-zip");
const fs = require("fs");

const docPath = "public/templates/template_surat_lengkap.docx";
const outDir = "./temp-docx";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const zip = new AdmZip(docPath);
zip.extractAllTo(outDir, true);

let docXml = fs.readFileSync(`${outDir}/word/document.xml`, "utf8");

// Print the XML structure around the "Kepada" or {isi_pembuka} tags
// so we can see what's causing the narrow column
const tokens = docXml.split("<w:p");
const interesting = tokens.filter(t => t.includes("{") || t.includes("Kepada") || t.includes("NIK"));

console.log(interesting.map(t => "<w:p" + t.substring(0, 300)).join("\n\n"));
