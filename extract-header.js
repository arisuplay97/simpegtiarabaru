const AdmZip = require("adm-zip");
const fs = require("fs");

const docPath = "public/templates/template_surat_lengkap.docx";
const tempDir = "./temp-docx";

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

const zip = new AdmZip(docPath);
zip.extractAllTo(tempDir, true);

// Get the actual image if any
let hasImage = false;
let imagePath = "";
if (fs.existsSync(`${tempDir}/word/media`)) {
    const files = fs.readdirSync(`${tempDir}/word/media`);
    if (files.length > 0) {
        hasImage = true;
        imagePath = `${tempDir}/word/media/${files[0]}`;
        fs.copyFileSync(imagePath, "./header_image.png");
        console.log("Saved header image to ./header_image.png");
    }
} else {
    console.log("No header image found in original template!");
}
