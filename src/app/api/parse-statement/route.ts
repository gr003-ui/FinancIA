import { NextRequest, NextResponse } from 'next/server';
import { parseStatementText } from '../../../lib/statementParser';

// Forzar runtime de Node.js (necesario para pdf-parse)
export const runtime = 'nodejs';

// Tipado para pdf-parse (compatible con CJS y ESM)
type PdfParseResult = { text: string; numpages: number };
type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

function getPdfParse(): PdfParseFn {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('pdf-parse') as PdfParseFn | { default: PdfParseFn };
  return typeof mod === 'function' ? mod : mod.default;
}

export async function POST(req: NextRequest) {
  let body: { imageBase64?: string; mimeType?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Archivo inválido o demasiado grande.' },
      { status: 400 }
    );
  }

  const { imageBase64, mimeType } = body;

  if (!imageBase64) {
    return NextResponse.json(
      { error: 'No se recibió ningún archivo.' },
      { status: 400 }
    );
  }

  const isPDF =
    mimeType === 'application/pdf' ||
    (mimeType ?? '').toLowerCase().includes('pdf');

  if (!isPDF) {
    return NextResponse.json(
      { error: 'Solo se soportan archivos PDF digitales (no escaneados).' },
      { status: 400 }
    );
  }

  const estimatedKB = (imageBase64.length * 0.75) / 1024;
  if (estimatedKB > 20000) {
    return NextResponse.json(
      { error: 'PDF demasiado grande (máx 20 MB).' },
      { status: 413 }
    );
  }

  let pdfText = '';

  try {
    const pdfParse = getPdfParse();
    const buffer   = Buffer.from(imageBase64, 'base64');
    const result   = await pdfParse(buffer);
    pdfText        = result.text ?? '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('pdf-parse error:', msg);

    if (
      msg.toLowerCase().includes('password') ||
      msg.toLowerCase().includes('encrypted')
    ) {
      return NextResponse.json(
        { error: 'El PDF está protegido con contraseña. Quitale la contraseña antes de subir.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          'No se pudo leer el PDF. Asegurate de que sea un PDF digital ' +
          '(descargado del homebanking o app del banco), no uno escaneado.',
        debug: msg.slice(0, 200),
      },
      { status: 422 }
    );
  }

  if (!pdfText || pdfText.trim().length < 20) {
    return NextResponse.json(
      {
        error:
          'El PDF no contiene texto extraíble. ' +
          'Probablemente es un PDF escaneado (imagen). ' +
          'Necesitás el PDF digital desde el homebanking.',
        rawText: pdfText.slice(0, 200),
      },
      { status: 422 }
    );
  }

  const transactions = parseStatementText(pdfText);

  if (transactions.length === 0) {
    return NextResponse.json(
      {
        error:
          'Se extrajo texto del PDF pero no se detectaron movimientos con el formato esperado. ' +
          'El banco puede usar un formato no estándar.',
        rawText: pdfText.slice(0, 600),
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ transactions });
}