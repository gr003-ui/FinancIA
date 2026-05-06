import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Aumenta el límite del body para PDFs pesados
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY no está configurada en .env.local' },
      { status: 500 }
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido — el archivo puede ser demasiado grande' }, { status: 400 });
  }

  const { imageBase64, mimeType } = body;

  if (!imageBase64) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
  }

  // Verifica tamaño aproximado (base64 ~1.37x el original)
  const estimatedSizeKB = (imageBase64.length * 0.75) / 1024;
  if (estimatedSizeKB > 15000) {
    return NextResponse.json(
      { error: 'El archivo es demasiado grande (máximo ~15MB). Probá con una imagen en lugar del PDF.' },
      { status: 413 }
    );
  }

  const safeMimeType = mimeType ?? 'image/jpeg';

  const prompt = `Analizá esta imagen o PDF de un resumen de tarjeta de crédito argentina.
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
- Para compras en cuotas: totalInstallments = número total de cuotas, currentInstallment = cuota actual
- Si dice "1/6" o "Cuota 1 de 6" significa currentInstallment=1, totalInstallments=6
- amount debe ser el monto de ESA cuota, NO el monto total de la compra
- currency puede ser "ARS" o "USD"
- Si no podés parsear una línea, omitila
- Solo incluí consumos individuales, NO incluyas subtotales, totales, saldos, pagos mínimos ni intereses
- Las fechas deben ser DD/MM/YYYY`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: safeMimeType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text().trim();

    // Limpia posibles backticks o texto extra que Gemini agrega a veces
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Si falla el parse, devolvemos el texto crudo para debug
      return NextResponse.json(
        {
          error: 'Gemini respondió pero el formato no es JSON válido. Probá con una imagen más clara.',
          raw: text.slice(0, 500),
        },
        { status: 422 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'La respuesta no es un array. Probá con una imagen más clara del resumen.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ transactions: parsed });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Gemini parse-statement error:', message);

    // Mensajes de error específicos de Gemini
    if (message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'Límite de la API de Gemini alcanzado. Esperá unos minutos e intentá de nuevo.' },
        { status: 429 }
      );
    }
    if (message.includes('INVALID_ARGUMENT')) {
      return NextResponse.json(
        { error: 'El archivo no pudo ser procesado por Gemini. Probá con una foto JPG del resumen en lugar del PDF.' },
        { status: 400 }
      );
    }
    if (message.includes('API_KEY') || message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: 'Clave de API de Gemini inválida o sin permisos. Verificá GEMINI_API_KEY en .env.local' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: `Error de Gemini: ${message.slice(0, 200)}` },
      { status: 500 }
    );
  }
}