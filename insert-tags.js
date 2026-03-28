// Script to insert docxtemplater tags into the user's format.docx
// The challenge: Word splits text across many <w:r> elements, 
// so we need to merge runs, insert tags, then output cleanly.

const AdmZip = require("adm-zip");
const fs = require("fs");

const srcPath = "public/format.docx";
const outPath = "public/templates/template_surat_lengkap.docx";
const tempDir = "./temp-format2";

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

const zip = new AdmZip(srcPath);
zip.extractAllTo(tempDir, true);

const xmlPath = `${tempDir}/word/document.xml`;
let xml = fs.readFileSync(xmlPath, "utf8");

// =============================================
// STEP 1: Find all <w:p> paragraphs, extract their plain text, 
// and identify which ones need tag replacement
// =============================================

// Helper: extract plain text from a paragraph XML chunk
function getPlainText(pXml) {
  const texts = [];
  const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = regex.exec(pXml)) !== null) {
    texts.push(m[1]);
  }
  return texts.join("");
}

// Helper: replace the text content of a paragraph with a single new text,
// keeping the formatting of the FIRST run
function replaceParagraphText(pXml, newText) {
  // Find all <w:r>...</w:r> elements
  const runs = [];
  const runRegex = /<w:r[ >].*?<\/w:r>/gs;
  let m;
  while ((m = runRegex.exec(pXml)) !== null) {
    runs.push({ match: m[0], index: m.index });
  }
  
  if (runs.length === 0) return pXml;
  
  // Keep the first run but replace its <w:t> content
  const firstRun = runs[0].match;
  const newRun = firstRun.replace(
    /<w:t[^>]*>[^<]*<\/w:t>/,
    `<w:t xml:space="preserve">${newText}</w:t>`
  );
  
  // Remove all subsequent runs (they contained the rest of the split text)
  let result = pXml;
  for (let i = runs.length - 1; i > 0; i--) {
    result = result.substring(0, runs[i].index) + result.substring(runs[i].index + runs[i].match.length);
  }
  // Replace first run with the new one
  result = result.replace(runs[0].match, newRun);
  
  return result;
}

// Split XML into paragraphs
const paragraphs = [];
const pRegex = /<w:p[ >].*?<\/w:p>/gs;
let pMatch;
while ((pMatch = pRegex.exec(xml)) !== null) {
  paragraphs.push({
    xml: pMatch[0],
    index: pMatch.index,
    text: getPlainText(pMatch[0])
  });
}

console.log("=== Paragraphs found ===");
paragraphs.forEach((p, i) => {
  if (p.text.trim()) {
    console.log(`[${i}] "${p.text.trim()}"`);
  }
});

// =============================================
// STEP 2: Define replacements
// =============================================
const replacements = [
  // These match the exact static text in the user's format.docx
  // We replace them with docxtemplater tags
  { find: (t) => t.includes("Nomor") && t.includes(":"), replace: "Nomor\t: {nomor_surat}" },
  { find: (t) => t.includes("Lampiran") && t.includes(":"), replace: "Lampiran\t: {lampiran}" },
  { find: (t) => t.includes("erihal") && t.includes(":"), replace: "Perihal\t: {perihal}" },
];

console.log("\n=== Applying replacements ===");

// Apply replacements
let newXml = xml;
for (const p of paragraphs) {
  const trimmed = p.text.trim();
  if (!trimmed) continue;
  
  for (const rep of replacements) {
    if (rep.find(trimmed)) {
      console.log(`Replacing "${trimmed}" -> "${rep.replace}"`);
      const newP = replaceParagraphText(p.xml, rep.replace);
      newXml = newXml.replace(p.xml, newP);
      break;
    }
  }
}

fs.writeFileSync(xmlPath, newXml);

// Zip back
const newZip = new AdmZip();
newZip.addLocalFolder(tempDir);
newZip.writeZip(outPath);

console.log(`\nTemplate saved to ${outPath}`);
