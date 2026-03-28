// Script: Build docxtemplater template from user's format.docx
const AdmZip = require("adm-zip");
const fs = require("fs");

const srcPath = "public/format.docx";
const outPath = "public/templates/template_surat_lengkap.docx";
const tempDir = "./temp-build";

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

const zip = new AdmZip(srcPath);
zip.extractAllTo(tempDir, true);

const xmlPath = `${tempDir}/word/document.xml`;
let xml = fs.readFileSync(xmlPath, "utf8");

// =============================================
// Helpers
// =============================================
function getPlainText(pXml) {
  const texts = [];
  const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = regex.exec(pXml)) !== null) texts.push(m[1]);
  return texts.join("");
}

function replaceParagraphText(pXml, newText) {
  const runs = [];
  const runRegex = /<w:r[ >].*?<\/w:r>/gs;
  let m;
  while ((m = runRegex.exec(pXml)) !== null) {
    runs.push({ match: m[0], index: m.index, length: m[0].length });
  }
  if (runs.length === 0) return pXml;
  const rPrMatch = runs[0].match.match(/<w:rPr>.*?<\/w:rPr>/s);
  const rPr = rPrMatch ? rPrMatch[0] : "";
  const newRun = `<w:r>${rPr}<w:t xml:space="preserve">${newText}</w:t></w:r>`;
  let result = pXml;
  for (let i = runs.length - 1; i >= 0; i--) {
    result = result.substring(0, runs[i].index) + result.substring(runs[i].index + runs[i].length);
  }
  result = result.replace("</w:p>", newRun + "</w:p>");
  return result;
}

// Standard paragraph - Times New Roman 12pt, left aligned
function makeParagraph(text, extraPPr = "") {
  return `<w:p><w:pPr>${extraPPr}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function makeEmpty() {
  return `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>`;
}

// Right aligned paragraph
function makeRight(text) {
  return makeParagraph(text, '<w:jc w:val="right"/>');
}

// Indented left paragraph (indent = twips from left, ~1440 twips = 1 inch = 2.54cm)
// 5670 twips ≈ 10cm from left → puts text in right ~40% of page
function makeIndentedParagraph(text, indentTwips = 5670) {
  return makeParagraph(text, `<w:ind w:left="${indentTwips}"/><w:jc w:val="center"/>`);
}

function makeBoldParagraph(text, indentTwips = 5670) {
  return `<w:p><w:pPr><w:ind w:left="${indentTwips}"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:b/><w:bCs/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

// =============================================
// STEP 1: Replace Nomor, Lampiran, Perihal
// =============================================
const pRegex = /<w:p[ >].*?<\/w:p>/gs;
let paragraphs = [];
let pm;
while ((pm = pRegex.exec(xml)) !== null) {
  paragraphs.push({ xml: pm[0], index: pm.index, text: getPlainText(pm[0]).trim() });
}

console.log("Found paragraphs:");
paragraphs.filter(p => p.text).forEach((p, i) => console.log(`  ${i}: "${p.text}"`));

for (const p of paragraphs) {
  if (p.text.startsWith("Nomor")) {
    xml = xml.replace(p.xml, replaceParagraphText(p.xml, "Nomor\t\t: {nomor_surat}"));
    console.log("✓ Replaced Nomor");
  }
  if (p.text.startsWith("Lampiran")) {
    xml = xml.replace(p.xml, replaceParagraphText(p.xml, "Lampiran\t: {lampiran}"));
    console.log("✓ Replaced Lampiran");
  }
  if (p.text.includes("erihal")) {
    xml = xml.replace(p.xml, replaceParagraphText(p.xml, "Perihal\t\t: {perihal}"));
    console.log("✓ Replaced Perihal");
  }
}

// =============================================
// STEP 2: Insert body AFTER Perihal
// =============================================
const perihalMatch = xml.match(/Perihal.*?\{perihal\}.*?<\/w:p>/s);
if (!perihalMatch) {
  console.error("ERROR: Could not find Perihal paragraph!");
  process.exit(1);
}
const insertPoint = xml.indexOf(perihalMatch[0]) + perihalMatch[0].length;

// Body content - MINIMAL spacing to fit 1 page
const bodyXml = [
  makeEmpty(),
  makeRight("Praya, {tanggal_surat}"),
  makeEmpty(),
  makeParagraph("Kepada"),
  makeParagraph("Yth. {kepada}"),
  makeParagraph("di -"),
  makeParagraph("      {tempat_tujuan}"),
  makeEmpty(),
  // Isi surat (justified)
  makeParagraph("{isi_pembuka}", '<w:jc w:val="both"/>'),
  makeEmpty(),
  // Penandatangan - indented left ~10cm sehingga di area kanan
  makeIndentedParagraph("{jabatan_penandatangan}"),
  makeEmpty(),
  makeEmpty(),
  makeBoldParagraph("{nama_penandatangan}"),
  makeIndentedParagraph("{nik_penandatangan}"),
].join("");

xml = xml.substring(0, insertPoint) + bodyXml + xml.substring(insertPoint);

// =============================================
// STEP 3: Save
// =============================================
fs.writeFileSync(xmlPath, xml);

const newZip = new AdmZip();
newZip.addLocalFolder(tempDir);
newZip.writeZip(outPath);

console.log(`\n✓ Template saved to ${outPath}`);
