import QRCode from 'qrcode';

/**
 * Standard ISO/IEC 18004 Compliant Clean QR Code Generator
 * Generates crisp, clean, low-density, large-pixel QR codes that scan instantly without clutter.
 */

// Synchronous SVG builder using QRCode.create with clean quiet zone
export function generateQrCodeSvg(text: string, size = 90): string {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'L' });
    const count = qr.modules.size;
    const margin = 2;
    const totalCount = count + margin * 2;
    const cellSize = (size / totalCount).toFixed(2);
    let rects = '';

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules.get(r, c)) {
          const x = ((c + margin) * Number(cellSize)).toFixed(2);
          const y = ((r + margin) * Number(cellSize)).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges" style="display:block;margin:0 auto;background:#fff;border-radius:4px;">${rects}</svg>`;
  } catch (e) {
    console.error('QR sync generation error:', e);
    return `<svg width="${size}" height="${size}"></svg>`;
  }
}

// Generate Scannable Data URL (base64 PNG)
export async function generateQrCodeDataUrl(text: string, size = 150): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 2,
      width: size,
      errorCorrectionLevel: 'L',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR code DataURL failed:', err);
    return '';
  }
}
