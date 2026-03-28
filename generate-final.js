// scripts/generate-final-template.js
const docx = require("docx");
const fs = require("fs");

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ImageRun } = docx;

// Read the extracted header image
const headerImageBytes = fs.readFileSync("./header_image.png");

// Transparent border for layout tables
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const doc = new Document({
  creator: "TRIS",
  title: "Template Surat Dinas TRIS",
  styles: {
    default: {
      document: {
        run: { size: 24, font: "Times New Roman" },
        paragraph: { spacing: { before: 0, after: 0, line: 360 } }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, right: 1134, bottom: 1134, left: 1440 }, // Top 1.27cm, Right 2cm, Left 2.54cm
        },
      },
      children: [
        // ======= KOP SURAT (Image) =======
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: headerImageBytes,
              transformation: {
                width: 700,
                height: 120, // Adjust aspect ratio roughly, word will scale it
              },
            }),
          ],
        }),
        new Paragraph({ text: "" }), // spacing
        
        // ======= TANGGAL SURAT (Kanan) =======
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Praya, {tanggal_surat}" }),
          ]
        }),
        new Paragraph({ text: "" }), 
        
        // ======= NOMOR, LAMPIRAN, PERIHAL =======
        new Table({
          borders: noBorders,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, children: [new Paragraph("Nomor")], width: { size: 15, type: WidthType.PERCENTAGE } }),
                new TableCell({ borders: noBorders, children: [new Paragraph(": {nomor_surat}")], width: { size: 85, type: WidthType.PERCENTAGE } }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, children: [new Paragraph("Lampiran")] }),
                new TableCell({ borders: noBorders, children: [new Paragraph(": {lampiran}")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, children: [new Paragraph("Perihal")] }),
                new TableCell({ borders: noBorders, children: [new Paragraph({ children: [new TextRun({ text: ": {perihal}", bold: true })] })] }),
              ]
            }),
          ]
        }),
        new Paragraph({ text: "" }),

        // ======= KEPADA =======
        new Paragraph("Kepada"),
        new Paragraph("Yth. {kepada}"),
        new Paragraph("di -"),
        // Note: Using tabs or spaces for indenting so we don't use nested tables that break docxtemplater
        new Paragraph("      {tempat_tujuan}"),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),

        // ======= ISI SURAT =======
        new Paragraph({
          text: "{isi_pembuka}",
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }), // Jarak sebelum ttd

        // ======= TTD (Kanan Bawah) =======
        new Table({
          borders: noBorders,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, children: [], width: { size: 60, type: WidthType.PERCENTAGE } }), // Spasi kiri 60%
                new TableCell({
                  borders: noBorders,
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: "{jabatan_penandatangan}", alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }), // Space for signature
                    new Paragraph({ 
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "{nama_penandatangan}", bold: true, underline: {} })] 
                    }),
                    new Paragraph({ text: "{label_nik}{nik_penandatangan}", alignment: AlignmentType.CENTER }),
                  ]
                }),
              ]
            })
          ]
        })
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("public/templates/template_surat_lengkap.docx", buffer);
  console.log("FINAL Template Generated to public/templates/template_surat_lengkap.docx");
});
