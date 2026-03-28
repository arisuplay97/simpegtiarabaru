const AdmZip = require("adm-zip");
const fs = require("fs");

const docPath = "public/format.docx";
const tempDir = "./temp-format";

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

const zip = new AdmZip(docPath);
zip.extractAllTo(tempDir, true);

// Read document.xml
const xmlPath = `${tempDir}/word/document.xml`;
const xml = fs.readFileSync(xmlPath, "utf8");

// Find all docxtemplater tags: {tag_name}
const tags = xml.match(/\{[^}]+\}/g) || [];
console.log("=== Tags found in format.docx ===");
console.log([...new Set(tags)].join("\n"));

// Check for headers/footers
const headerFiles = fs.readdirSync(`${tempDir}/word`).filter(f => f.startsWith("header") || f.startsWith("footer"));
console.log("\n=== Header/Footer files ===");
console.log(headerFiles.join("\n"));

// Check media
if (fs.existsSync(`${tempDir}/word/media`)) {
  const mediaFiles = fs.readdirSync(`${tempDir}/word/media`);
  console.log("\n=== Media files ===");
  console.log(mediaFiles.join("\n"));
}

// Print the full text content (stripped XML) to see layout
const textContent = xml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
console.log("\n=== Text content (first 2000 chars) ===");
console.log(textContent.substring(0, 2000));
