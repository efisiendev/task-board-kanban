#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { mdToPdf } = require('md-to-pdf')

const mdPath = path.join(__dirname, '../docs/EMA_User_Guide.md')
const pdfPath = path.join(__dirname, '../docs/EMA_User_Guide.pdf')
const cssPath = path.join(__dirname, '../docs/pdf-styles.css')

// Custom CSS for professional PDF output
const css = `
/* Page setup */
@page {
  size: A4;
  margin: 20mm;
}

/* Base typography */
body {
  font-family: 'Segoe UI', 'Arial', sans-serif;
  line-height: 1.6;
  color: #333;
  font-size: 11pt;
}

/* Headings */
h1 {
  color: #1f2937;
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 10px;
  margin-top: 30px;
  margin-bottom: 20px;
  page-break-before: always;
  page-break-after: avoid;
}

h1:first-of-type {
  page-break-before: avoid;
  text-align: center;
  font-size: 28pt;
  margin-top: 0;
}

h2 {
  color: #374151;
  border-bottom: 2px solid #93c5fd;
  padding-bottom: 5px;
  margin-top: 25px;
  margin-bottom: 15px;
  page-break-after: avoid;
}

h3 {
  color: #4b5563;
  margin-top: 20px;
  margin-bottom: 10px;
  page-break-after: avoid;
}

h4 {
  color: #6b7280;
  margin-top: 15px;
  margin-bottom: 8px;
}

/* Paragraphs */
p {
  margin-bottom: 10px;
}

/* Lists */
ul, ol {
  margin-bottom: 15px;
  padding-left: 25px;
}

li {
  margin-bottom: 5px;
}

/* Tables */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
  page-break-inside: avoid;
  font-size: 10pt;
}

th, td {
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #f3f4f6;
  font-weight: bold;
  color: #1f2937;
}

tr:nth-child(even) {
  background-color: #f9fafb;
}

/* Code blocks */
code {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 9pt;
  color: #dc2626;
}

pre {
  background-color: #f3f4f6;
  padding: 12px;
  border-radius: 5px;
  border-left: 4px solid #3b82f6;
  overflow-x: auto;
  page-break-inside: avoid;
}

pre code {
  background: none;
  padding: 0;
  color: #333;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 15px;
  margin-left: 0;
  color: #4b5563;
  font-style: italic;
}

/* Links */
a {
  color: #3b82f6;
  text-decoration: none;
}

/* Horizontal rules */
hr {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 20px 0;
}

/* Special markers */
strong {
  color: #1f2937;
  font-weight: 600;
}

em {
  font-style: italic;
  color: #4b5563;
}

/* Print-specific rules */
@media print {
  h1, h2, h3 {
    page-break-after: avoid;
  }

  table, pre, blockquote {
    page-break-inside: avoid;
  }

  p, li {
    orphans: 3;
    widows: 3;
  }
}
`

async function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation...')
    console.log(`📄 Source: ${mdPath}`)
    console.log(`📁 Output: ${pdfPath}`)

    // Check if source file exists
    if (!fs.existsSync(mdPath)) {
      throw new Error(`Source file not found: ${mdPath}`)
    }

    // Write CSS to temporary file
    fs.writeFileSync(cssPath, css, 'utf8')

    // Generate PDF
    const pdf = await mdToPdf(
      { path: mdPath },
      {
        dest: pdfPath,
        stylesheet: cssPath,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          printBackground: true,
          preferCSSPageSize: true
        }
      }
    )

    // Clean up CSS file
    if (fs.existsSync(cssPath)) {
      fs.unlinkSync(cssPath)
    }

    const fileSizeKB = (pdf.content.length / 1024).toFixed(2)
    const fileSizeMB = (pdf.content.length / 1024 / 1024).toFixed(2)

    console.log('')
    console.log('✅ PDF generated successfully!')
    console.log(`📊 File size: ${fileSizeKB} KB (${fileSizeMB} MB)`)
    console.log(`📍 Location: ${pdfPath}`)
    console.log('')
    console.log('🎉 EMA User Guide is ready for distribution!')

  } catch (error) {
    console.error('')
    console.error('❌ Error generating PDF:')
    console.error(error.message)
    console.error('')
    console.error('Troubleshooting:')
    console.error('  1. Make sure md-to-pdf is installed: npm install md-to-pdf')
    console.error('  2. Check that EMA_User_Guide.md exists in docs/ folder')
    console.error('  3. Verify Node.js version is 14 or higher')
    console.error('')
    process.exit(1)
  }
}

// Run the generator
generatePDF()
