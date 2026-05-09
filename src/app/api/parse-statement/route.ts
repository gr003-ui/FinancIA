import { NextRequest, NextResponse } from 'next/server';
import { parseStatementText } from '../../../lib/statementParser';

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
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }

  const isPDF = mimeType === 'application/pdf' ||
                (mimeType ?? '').includes('pdf');

  if (!isPDF) {
    return NextResponse.json(
      {
        error:
          'Solo se soportan archivos PDF. Para imágenes, usá la opción de carga manual ' +
          'o convertí la imagen a PDF primero.',
      },
      { status: 400 }
    );
  }

  const estimatedKB = (imageBase64.length * 0.75) / 1024;
  if (estimatedKB > 20000) {
    return NextResponse.json(
      { error: 'PDF demasiado grande (máx 20MB).' },
      { status: 413 }
    );
  }

  try {
    // Importación dinámica para evitar problemas con el bundler
    const pdfParse = (await import('pdf-parse')).default;
    const buffer   = Buffer.from(imageBase64, 'base64');
    const pdfData  = await pdfParse(buffer);
    const text     = pdfData.text;

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            'El PDF no contiene texto extraíble (puede ser una imagen escaneada). ' +
            'Intentá con un PDF digital, no escaneado.',
        },
        { status: 422 }
      );
    }

    const transactions = parseStatementText(text);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error:
            'No se detectaron movimientos en el PDF. ' +
            'Verificá que sea el resumen de consumos (no el resumen general). ' +
            'También podés cargar los movimientos manualmente.',
          rawText: text.slice(0, 500), // primeras 500 chars para debug
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ transactions });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('parse-statement error:', msg);

    if (msg.includes('Invalid PDF') || msg.includes('pdf')) {
      return NextResponse.json(
        { error: 'El archivo no es un PDF válido o está protegido con contraseña.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Error al procesar el PDF: ${msg.slice(0, 150)}` },
      { status: 500 }
    );
  }
}