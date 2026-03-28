// scripts/generate-template.js
const docx = require("docx");
const fs = require("fs");

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, VerticalAlign, ExternalHyperlink } = docx;

// Buat dokumen word kosong dengan margin surat dinas standar (A4)
const doc = new Document({
  creator: "TRIS App",
  title: "Template Surat Dinas",
  description: "Template dasar surat dinas TRIS",
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
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1440 }, // Top/Right/Bottom: 2cm, Left: 2.54cm
        },
      },
      children: [
        // ======= KOP SURAT (Diletakkan manual oleh user / dicetak di kertas kop) =======
        new Paragraph({
          text: "{nomor_surat}",
          alignment: AlignmentType.LEFT,
        }),
        
        // ======= TANGGAL SURAT (Kanan) =======
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Praya, {tanggal_surat}" }),
          ]
        }),
        new Paragraph({ text: "" }), // spacing
        
        // ======= NOMOR, LAMPIRAN, PERIHAL =======
        new Table({
          borders: docx.TableBorders.NONE,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Nomor")], width: { size: 15, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph(": {nomor_surat}")], width: { size: 85, type: WidthType.PERCENTAGE } }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Lampiran")] }),
                new TableCell({ children: [new Paragraph(": {lampiran}")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Perihal")] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ": {perihal}", bold: true })] })] }),
              ]
            }),
          ]
        }),
        new Paragraph({ text: "" }),

        // ======= KEPADA =======
        new Paragraph("Kepada"),
        new Paragraph("Yth. {kepada}"),
        new Paragraph("di -"),
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
          borders: docx.TableBorders.NONE,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [], width: { size: 60, type: WidthType.PERCENTAGE } }), // Spasi kiri 60%
                new TableCell({
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
  console.log("Template Generated to public/templates/template_surat_lengkap.docx");
});
