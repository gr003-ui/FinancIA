import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY no está en .env.local. Agregala y reiniciá con npm run dev.' },
      { status: 500 }
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'El archivo puede ser demasiado grande o el formato es inválido.' },
      { status: 400 }
    );
  }

  const { imageBase64, mimeType } = body;

  if (!imageBase64) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }

  const estimatedKB = (imageBase64.length * 0.75) / 1024;
  if (estimatedKB > 15000) {
    return NextResponse.json(
      { error: 'Archivo demasiado grande (máx ~15MB). Probá con una foto JPG.' },
      { status: 413 }
    );
  }

  const safeMime = mimeType ?? 'image/jpeg';

  const prompt = `Analizá esta imagen de un resumen de tarjeta de crédito argentina.
Extraé TODOS los consumos/movimientos que veas.
Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin backticks.
El formato debe ser exactamente este array:
[
  {
    "date": "DD/MM/YYYY",
    "description": "descripción del consumo",
    "amount": 1234.56,
    "currentInstallment": 1,
    "totalInstallments": 1,
    "currency": "ARS"
  }
]
Reglas:
- Para cuotas: totalInstallments = total de cuotas, currentInstallment = cuota actual mostrada
- amount = monto de ESA cuota (no el total)
- currency = "ARS" o "USD"
- Solo consumos individuales, no totales ni saldos
- Fechas en formato DD/MM/YYYY`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      { inlineData: { mimeType: safeMime, data: imageBase64 } },
      { text: prompt },
    ]);

    const raw   = result.response.text().trim();
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: 'Gemini no devolvió JSON válido. Probá con una foto más clara.', raw: raw.slice(0, 300) },
        { status: 422 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'La respuesta no es un array. Probá con otra imagen.', raw: raw.slice(0, 300) },
        { status: 422 }
      );
    }

    return NextResponse.json({ transactions: parsed });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('parse-statement error:', msg);

    if (msg.includes('INVALID_ARGUMENT')) {
      return NextResponse.json(
        { error: 'Gemini no pudo procesar el archivo. Probá con una foto JPG en lugar del PDF.' },
        { status: 400 }
      );
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: 'API Key inválida. Verificá GEMINI_API_KEY en .env.local.' },
        { status: 401 }
      );
    }
    if (msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'Límite de Gemini alcanzado. Esperá unos minutos.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Error: ${msg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}