import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return NextResponse.json(
      { text: '__NO_KEY__', retryAfter: 0 },
      { status: 200 }
    );
  }

  let body: {
    message?: string;
    history?: { role: string; text: string }[];
    balance?: number;
    exchangeRate?: number;
    transactions?: unknown[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ text: 'Error: body invalido.', retryAfter: 0 }, { status: 400 });
  }

  const {
    message,
    history      = [],
    balance      = 0,
    exchangeRate = 1000,
    transactions = [],
  } = body;

  if (!message) {
    return NextResponse.json({ text: 'Mensaje vacio.', retryAfter: 0 }, { status: 400 });
  }

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const systemPrompt = `Sos FinancIA, un analista financiero experto en el mercado argentino.
Contexto actual:
- Saldo neto: ${formatM(balance)}
- Cotizacion USD/ARS: $${exchangeRate}
- Ultimos movimientos: ${JSON.stringify((transactions).slice(0, 8))}

Reglas:
- Responde en espaniol rioplatense, maximo 3-4 parrafos
- Usa **negrita** para numeros clave
- Si gasta mucho en no esenciales, se levemente ironico pero constructivo
- No inventes datos que no esten en el contexto`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const geminiHistory = [
      { role: 'user'  , parts: [{ text: systemPrompt }] },
      { role: 'model' , parts: [{ text: 'Entendido. Soy FinancIA.' }] },
      ...history.map((m) => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
    ];

    const chat   = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    return NextResponse.json({ text: result.response.text(), retryAfter: 0 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Gemini /api/chat error:', msg);

    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ text: '__QUOTA__', retryAfter: 60 });
    }
    if (
      msg.includes('API_KEY_INVALID') ||
      msg.includes('PERMISSION_DENIED') ||
      msg.includes('401') || msg.includes('403') ||
      msg.toLowerCase().includes('api key not valid')
    ) {
      return NextResponse.json({ text: '__BAD_KEY__', retryAfter: 0 });
    }
    return NextResponse.json({ text: `Error inesperado: ${msg.slice(0, 150)}`, retryAfter: 0 });
  }
}
