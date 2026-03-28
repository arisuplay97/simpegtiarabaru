const AdmZip = require("adm-zip");
const fs = require("fs");

const docPath = "public/templates/template_surat_lengkap.docx";
const tempDir = "./temp-docx";

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

const zip = new AdmZip(docPath);
zip.extractAllTo(tempDir, true);

const xmlPath = `${tempDir}/word/document.xml`;
let xml = fs.readFileSync(xmlPath, "utf8");

// 1. Remove all right indent margins <w:ind w:right="..." /> that force narrow text
xml = xml.replace(/<w:ind[^>]*w:right="[^"]*"[^>]*\/>/g, (match) => {
  // If it also has left indent, keep left indent but remove right
  return match.replace(/w:right="[^"]*"/, "");
});
// Handle cases where <w:ind> is not self-closing (rare, but possible)
xml = xml.replace(/w:right="[^"]*"/g, ""); 

// 2. Fix the hardcoded NIK text so we can hide it for Direksi
xml = xml.replace(/NIK\.\s*/g, "{label_nik}");

// 3. Ensure "Praya, {tanggal_surat}" is right aligned if it isn't
xml = xml.replace(/(<w:p [^>]*>)(.*?Praya,\s*\{tanggal_surat\})/g, (match, pTag, content) => {
    // Add right alignment to the paragraph if missing
    if (!pTag.includes('w:jc w:val="right"')) {
        return pTag.replace('<w:pPr>', '<w:pPr><w:jc w:val="right"/>') + content;
    }
    return match;
});

// 4. Also right align the signature block if it's currently left aligned with heavy left indents
// We look for "{jabatan_penandatangan}" and "{nama_penandatangan}"
// But wait, the user image showed it on the left. The user wants it "di pojok kanan bawah"
xml = xml.replace(/<w:pPr>.*?<\/w:pPr>(.*?\{jabatan_penandatangan\})/g, (match) => {
    return match.replace('<w:pPr>', '<w:pPr><w:jc w:val="right"/>');
});
xml = xml.replace(/<w:pPr>.*?<\/w:pPr>(.*?\{nama_penandatangan\})/g, (match) => {
    return match.replace('<w:pPr>', '<w:pPr><w:jc w:val="right"/>');
});
xml = xml.replace(/<w:pPr>.*?<\/w:pPr>(.*?\{label_nik\})/g, (match) => {
    return match.replace('<w:pPr>', '<w:pPr><w:jc w:val="right"/>');
});

fs.writeFileSync(xmlPath, xml);

const newZip = new AdmZip();
newZip.addLocalFolder(tempDir);
newZip.writeZip("public/templates/template_surat_lengkap.docx");

console.log("Template patched with regex!");
