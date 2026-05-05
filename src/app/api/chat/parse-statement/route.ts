import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analizá esta imagen de un resumen de tarjeta de crédito argentina.
Extraé TODOS los consumos/movimientos que veas.
Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin backticks.
El formato debe ser exactamente este array:
[
  {
    "date": "DD/MM/YYYY",
    "description": "descripción del consumo",
    "amount": 1234.56,
    "installments": 1,
    "currentInstallment": 1,
    "totalInstallments": 1,
    "currency": "ARS"
  }
]
Reglas:
- Para compras en cuotas: installments = número total de cuotas, currentInstallment = cuota actual
- Si dice "1/6" significa cuota 1 de 6
- amount debe ser el monto de ESA cuota, no el total
- currency puede ser "ARS" o "USD"
- Si no podés parsear una línea, omitila
- Solo incluí consumos, no totales ni saldos`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType ?? 'image/jpeg',
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text().trim();

    let parsed;
    try {
      // Limpia posibles backticks o texto extra
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: 'No se pudo parsear la respuesta de Gemini', raw: text },
        { status: 422 }
      );
    }

    return NextResponse.json({ transactions: parsed });
  } catch (err) {
    console.error('Parse statement error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}