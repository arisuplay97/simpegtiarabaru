const AdmZip = require("adm-zip");
const fs = require("fs");

const docPath = "public/templates/template_surat_lengkap.docx";
const tempDir = "./temp-docx";

// Setup
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

// Extract
const zip = new AdmZip(docPath);
zip.extractAllTo(tempDir, true);

// Fix XML
const xmlPath = `${tempDir}/word/document.xml`;
let xml = fs.readFileSync(xmlPath, "utf8");

// 1. Fix Kepada narrow column limit (w:gridCol w:w)
// Currently it's likely set to a tiny width in the hidden table. We can remove table logic for Kepada entirely, 
// replacing the whole table that contains Kepada with just paragraphs.
// Actually, safer is to just replace the broken NIK label and rely on the multi-line TS fix.
// Let's replace the hardcoded "NIK. " with a tag so it only shows if we pass it from TS.
xml = xml.replace(/NIK\.\s*/g, "{label_nik}");

fs.writeFileSync(xmlPath, xml);

// Zip back
const newZip = new AdmZip();
newZip.addLocalFolder(tempDir);
newZip.writeZip("public/templates/template_surat_lengkap.docx");

console.log("Template patched!");
