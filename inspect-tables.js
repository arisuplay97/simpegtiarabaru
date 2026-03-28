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

// Print table definitions to find the narrow ones
// We look for <w:tbl> ... </w:tbl>
const tables = xml.match(/<w:tbl>.*?<\/w:tbl>/gs) || [];
console.log(`Found ${tables.length} tables`);

// In docx, column widths are defined in <w:tblGrid> -> <w:gridCol w:w="..."/>
tables.forEach((tbl, i) => {
  const gridCols = tbl.match(/<w:gridCol w:w="(\d+)"/g);
  console.log(`Table ${i}:`, gridCols);
});
