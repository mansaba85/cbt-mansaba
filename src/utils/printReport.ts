/**
 * Utility untuk mencetak laporan menggunakan HTML dan CSS sederhana.
 * Menggunakan iframe tersembunyi untuk proses pencetakan agar tidak mengganggu UI utama
 * dan tidak memerlukan rendering komponen React dashboard di layar.
 */

export const printReport = (title: string, contentHtml: string, options: { landscape?: boolean; styles?: string } = {}) => {
  const iframe = document.createElement('iframe');
  
  // Sembunyikan iframe dari tampilan
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.id = 'print-frame';
  
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  
  if (!doc) {
    console.error('Gagal mengakses iframe pencetakan');
    return;
  }

  const baseStyles = `
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    @page { 
      margin: 0; 
      size: A4 ${options.landscape ? 'landscape' : 'portrait'};
    }
    body { 
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
      font-size: 11px; 
      line-height: 1.4;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 10mm 15mm;
      width: 100% !important;
      max-width: 100% !important;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3.5px solid #000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      width: 100% !important;
    }
    .header img {
      width: 75px;
      height: 75px;
      object-fit: contain;
    }
    .header-text {
      text-align: center;
      flex: 1;
      padding: 0 10px;
    }
    .header-spacer {
      width: 75px; /* Sama dengan lebar logo untuk keseimbangan teks tengah */
    }
    .header-text h1 {
      margin: 0;
      font-size: 19px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #000;
    }
    .header-text p {
      margin: 2px 0 0 0;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #333;
    }
    .title-area {
      text-align: center;
      margin-bottom: 15px;
      width: 100% !important;
    }
    .title-area h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      text-decoration: underline;
      text-underline-offset: 4px;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 12px;
      font-size: 10px;
      font-weight: 800;
      width: 100% !important;
    }
    .meta-right {
      text-align: right;
    }
    table {
      width: 100% !important;
      min-width: 100% !important;
      border-collapse: collapse;
      margin-top: 5px;
      table-layout: auto;
    }
    th, td {
      border: 1.5px solid #000;
      padding: 6px 8px;
      text-align: left;
      word-wrap: break-word;
    }
    th {
      background-color: #f2f2f2 !important;
      font-weight: 950;
      text-transform: uppercase;
      font-size: 9px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 800; }
    .uppercase { text-transform: uppercase; }
    
    .footer-sign {
      margin-top: 40px;
      display: flex;
      justify-content: flex-end;
      width: 100% !important;
    }
    .sign-box {
      width: 250px;
      text-align: center;
    }
    .sign-space {
      height: 65px;
    }
    .sign-line {
      border-bottom: 1.5px solid #000;
      width: 100%;
      margin-bottom: 5px;
    }
    
    ${options.styles || ''}
  `;

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>${baseStyles}</style>
    </head>
    <body style="width: 100% !important;">
      ${contentHtml}
    </body>
    </html>
  `;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Tunggu gambar dan assets selesai dimuat
  const images = doc.getElementsByTagName('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  Promise.all(imagePromises).then(() => {
    // Beri sedikit buffer untuk rendering browser
    setTimeout(() => {
        if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
        
        setTimeout(() => {
            if (document.getElementById('print-frame')) {
                document.body.removeChild(iframe);
            }
        }, 1000);
    }, 500);
  });
};
